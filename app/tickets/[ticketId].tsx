import { formatDate, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Screen } from '@/components/screens/screen';
import { useTicket } from '@/features/tickets/api';
import { TicketQrModal } from '@/features/tickets/components/ticket-qr-modal';
import type { TicketStatus } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

function useStatusColors(status: TicketStatus) {
  const tokens = useTokens();
  if (status === 'ISSUED') {
    return { bg: tokens.color.feedback.success.bg, fg: tokens.color.feedback.success.fg };
  }
  if (status === 'VOIDED') {
    return { bg: tokens.color.feedback.danger.bg, fg: tokens.color.feedback.danger.fg };
  }
  return { bg: tokens.color.bg.muted, fg: tokens.color.text.muted };
}

/** UC-12 · Ticket detail (Eventbrite-style): event info + perforated stub + QR. */
export default function TicketDetailScreen() {
  const tokens = useTokens();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation('tickets');
  const locale = i18n.language as Locale;
  const ticket = useTicket(id);
  const [qrOpen, setQrOpen] = useState(false);
  const status = useStatusColors(ticket.data?.status ?? 'ISSUED');

  if (ticket.isLoading) {
    return (
      <Screen title={t('title')} showBack padded={false}>
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      </Screen>
    );
  }

  if (!ticket.data) {
    return (
      <Screen title={t('title')} showBack padded={false}>
        <Text style={[styles.center, { color: tokens.color.text.muted }]}>{t('error')}</Text>
      </Screen>
    );
  }

  const data = ticket.data;
  const orderCode = data.id.slice(0, 8).toUpperCase();

  return (
    <Screen title={t('title')} showBack padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.card,
            { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
          ]}>
          <Image
            source={{ uri: `https://picsum.photos/seed/bandada-event-${data.eventId}/1200/675` }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
          />

          <View style={styles.body}>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.fg }]}>
                {t(`status.${data.status}`)}
              </Text>
            </View>
            <Text style={[styles.event, { color: tokens.color.text.primary }]}>
              {data.eventTitle ?? t('ticket')}
            </Text>
            {data.eventStartsAt ? (
              <InfoRow
                icon="calendar-month-outline"
                text={formatDate(data.eventStartsAt, locale, 'long')}
              />
            ) : null}
            {data.venue ? <InfoRow icon="map-marker-outline" text={data.venue} /> : null}
          </View>

          <PerforatedDivider />

          <Pressable
            onPress={() => setQrOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('tapToEnlarge')}
            style={styles.qrSection}>
            <View style={[styles.qrBox, { backgroundColor: tokens.color.qr.bg }]}>
              <QRCode
                value={data.qrPayload}
                size={188}
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

          <Text style={[styles.order, { color: tokens.color.text.muted }]}>
            {t('orderCode', { code: orderCode })}
          </Text>
        </View>
      </ScrollView>

      <TicketQrModal visible={qrOpen} ticket={data} onClose={() => setQrOpen(false)} />
    </Screen>
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

function PerforatedDivider() {
  const tokens = useTokens();
  return (
    <View style={styles.perfWrap}>
      <View style={[styles.perfLine, { borderTopColor: tokens.color.border.default }]} />
      <View style={[styles.notch, styles.notchLeft, { backgroundColor: tokens.color.bg.canvas }]} />
      <View style={[styles.notch, styles.notchRight, { backgroundColor: tokens.color.bg.canvas }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 24, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
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
  qrBox: { padding: 16, borderRadius: 16 },
  enlargeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  enlarge: { fontSize: 13 },
  order: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', paddingBottom: 20 },
});
