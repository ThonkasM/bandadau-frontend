import { formatDate, type Locale } from '@bandada/i18n';
import type { ThemeTokens } from '@bandada/ui-tokens';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import type { Ticket, TicketStatus } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

function statusColors(tokens: ThemeTokens, status: TicketStatus) {
  if (status === 'ISSUED') {
    return { bg: tokens.color.feedback.success.bg, fg: tokens.color.feedback.success.fg };
  }
  if (status === 'VOIDED') {
    return { bg: tokens.color.feedback.danger.bg, fg: tokens.color.feedback.danger.fg };
  }
  return { bg: tokens.color.bg.muted, fg: tokens.color.text.muted };
}

/**
 * Reusable Eventbrite-style ticket (cover, event info, perforated stub and QR).
 * Shared by the ticket detail, the post-purchase reveal and the "My tickets" list.
 * `qr` is optional: without it (list endpoint has no `qrPayload`) a "view QR" affordance is shown.
 */
export function TicketView({
  ticket,
  qr,
  qrSize = 188,
  notchColor,
  onPress,
  onPressQr,
  style,
}: {
  ticket: Ticket;
  qr?: string;
  qrSize?: number;
  notchColor?: string;
  onPress?: () => void;
  onPressQr?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('tickets');
  const locale = i18n.language as Locale;
  const status = statusColors(tokens, ticket.status);
  const orderCode = ticket.id.slice(0, 8).toUpperCase();
  const notch = notchColor ?? tokens.color.bg.canvas;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
        style,
      ]}>
      <Image
        source={{ uri: `https://picsum.photos/seed/bandada-event-${ticket.eventId}/1200/675` }}
        style={styles.cover}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.fg }]}>{t(`status.${ticket.status}`)}</Text>
        </View>
        <Text style={[styles.event, { color: tokens.color.text.primary }]} numberOfLines={2}>
          {ticket.eventTitle ?? t('ticket')}
        </Text>
        {ticket.eventStartsAt ? (
          <InfoRow
            icon="calendar-month-outline"
            text={formatDate(ticket.eventStartsAt, locale, 'long')}
          />
        ) : null}
        {ticket.venue ? <InfoRow icon="map-marker-outline" text={ticket.venue} /> : null}
      </View>

      <View style={styles.perfWrap}>
        <View style={[styles.perfLine, { borderTopColor: tokens.color.border.default }]} />
        <View style={[styles.notch, styles.notchLeft, { backgroundColor: notch }]} />
        <View style={[styles.notch, styles.notchRight, { backgroundColor: notch }]} />
      </View>

      <View style={styles.qrSection}>
        {qr ? (
          <Pressable
            onPress={onPressQr}
            accessibilityRole="button"
            accessibilityLabel={t('tapToEnlarge')}
            style={styles.qrPress}>
            <View style={[styles.qrBox, { backgroundColor: tokens.color.qr.bg }]}>
              <QRCode
                value={qr}
                size={qrSize}
                backgroundColor={tokens.color.qr.bg}
                color={tokens.color.qr.fg}
              />
            </View>
            <View style={styles.enlargeRow}>
              <MaterialCommunityIcons
                name="arrow-expand"
                size={16}
                color={tokens.color.text.muted}
              />
              <Text style={[styles.enlarge, { color: tokens.color.text.muted }]}>
                {t('tapToEnlarge')}
              </Text>
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={[styles.qrPlaceholder, { borderColor: tokens.color.border.default }]}>
            <MaterialCommunityIcons name="qrcode" size={40} color={tokens.color.text.muted} />
            <Text style={[styles.enlarge, { color: tokens.color.text.muted }]}>{t('viewQr')}</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.order, { color: tokens.color.text.muted }]}>
        {t('orderCode', { code: orderCode })}
      </Text>
    </Pressable>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}) {
  const tokens = useTokens();
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={tokens.color.text.muted} />
      <Text style={[styles.infoText, { color: tokens.color.text.secondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20 },
  cover: { width: '100%', height: 180, borderTopLeftRadius: 19, borderTopRightRadius: 19 },
  body: { padding: 20, gap: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
  event: { fontSize: 20, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  infoText: { fontSize: 14, flex: 1 },
  perfWrap: { height: 24, justifyContent: 'center' },
  perfLine: { borderTopWidth: 1, borderStyle: 'dashed' },
  notch: { position: 'absolute', width: 22, height: 22, borderRadius: 11 },
  notchLeft: { left: -11 },
  notchRight: { right: -11 },
  qrSection: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  qrPress: { alignItems: 'center', gap: 8 },
  qrBox: { padding: 16, borderRadius: 16 },
  qrPlaceholder: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  enlargeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  enlarge: { fontSize: 13 },
  order: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingBottom: 20,
  },
});
