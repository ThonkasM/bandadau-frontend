import { formatDate, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BandadaMark, BandadaWordmark } from '@/components/brand/BandadaLogo';
import type { TicketDetail } from '@/features/tickets/types';
import { useTheme, useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

/** Full-screen, always-light QR (for scanning) with branding, larger QR and a scale/fade entrance. */
export function TicketQrModal({
  visible,
  ticket,
  onClose,
}: {
  visible: boolean;
  ticket: TicketDetail;
  onClose: () => void;
}) {
  const tokens = useTokens();
  const brand = useBrand();
  const { effective } = useTheme();
  const { width } = useWindowDimensions();
  const { t, i18n } = useTranslation(['tickets', 'app']);
  const locale = i18n.language as Locale;
  const progress = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: 220 });
      pop.value = withSpring(1, { damping: 14, stiffness: 160 });
    } else {
      progress.value = 0;
      pop.value = 0;
    }
  }, [visible, progress, pop]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + pop.value * 0.1 }],
  }));

  const qrSize = Math.min(300, width - 140);
  const orderCode = ticket.id.slice(0, 8).toUpperCase();
  const scrim = effective === 'dark' ? tokens.color.bg.canvas : tokens.color.bg.inverse;
  const ink = tokens.color.qr.fg;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: scrim }, backdrop]} />
        <Animated.View style={[styles.card, { backgroundColor: tokens.color.qr.bg }, card]}>
          <Pressable
            onPress={onClose}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel={t('app:close')}
            hitSlop={10}>
            <MaterialCommunityIcons name="close" size={24} color={ink} />
          </Pressable>

          <View style={styles.brandRow}>
            <BandadaMark size={24} color={brand.color} accent={brand.accent} />
            <BandadaWordmark width={86} color={brand.color} accent={brand.accent} />
          </View>

          <Text style={[styles.event, { color: ink }]} numberOfLines={2}>
            {ticket.eventTitle ?? t('ticket')}
          </Text>
          {ticket.eventStartsAt ? (
            <Text style={[styles.meta, { color: ink }]}>
              {formatDate(ticket.eventStartsAt, locale, 'long')}
            </Text>
          ) : null}
          {ticket.venue ? <Text style={[styles.meta, { color: ink }]}>{ticket.venue}</Text> : null}

          <View style={styles.qrWrap}>
            <QRCode
              value={ticket.qrPayload}
              size={qrSize}
              backgroundColor={tokens.color.qr.bg}
              color={ink}
            />
          </View>

          <Text style={[styles.hint, { color: ink }]}>{t('qrHint')}</Text>
          <Text style={[styles.order, { color: ink }]}>{t('orderCode', { code: orderCode })}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 6,
    padding: 24,
    borderRadius: 24,
  },
  close: { position: 'absolute', top: 12, right: 12, zIndex: 2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  event: { fontSize: 18, fontWeight: '800', textAlign: 'center', paddingHorizontal: 24 },
  meta: { fontSize: 13, textAlign: 'center', opacity: 0.7 },
  qrWrap: { marginTop: 14, padding: 12 },
  hint: { fontSize: 13, textAlign: 'center', marginTop: 12, opacity: 0.7 },
  order: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, opacity: 0.6 },
});
