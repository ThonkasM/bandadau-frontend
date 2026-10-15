import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { TicketPass } from '@/features/tickets/components/ticket-pass';
import type { TicketDetail } from '@/features/tickets/types';
import { useTheme, useTokens } from '@/theme/theme-provider';

/**
 * UC-12 · Overlaid ticket: the pass shown on top of the list, tappable to tilt
 * (device motion on native, drag on web).
 */
export function TicketPassModal({
  visible,
  ticket,
  onClose,
}: {
  visible: boolean;
  ticket: TicketDetail;
  onClose: () => void;
}) {
  const tokens = useTokens();
  const { effective } = useTheme();
  const { t } = useTranslation(['tickets', 'app']);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = visible ? withTiming(1, { duration: 200 }) : 0;
  }, [visible, opacity]);

  const backdrop = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const scrim = effective === 'dark' ? tokens.color.bg.canvas : tokens.color.bg.inverse;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.overlay}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: scrim, opacity: 0.6 }, backdrop]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('app:close')} />

          <View style={styles.center} pointerEvents="box-none">
            <TicketPass ticket={ticket} qr={ticket.qrPayload} interactive motion />
            <Text style={[styles.hint, { color: tokens.color.text.inverse }]}>
              {t('pass.tiltHint')}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('app:close')}
            hitSlop={10}
            style={[styles.close, { backgroundColor: tokens.color.bg.surface }]}>
            <MaterialCommunityIcons name="close" size={22} color={tokens.color.text.primary} />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  center: { width: '100%', alignItems: 'center', gap: 14 },
  hint: { fontSize: 13, fontWeight: '600', textAlign: 'center', opacity: 0.85 },
  close: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
