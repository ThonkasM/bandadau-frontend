import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TicketView } from '@/features/tickets/components/ticket-view';
import type { TicketDetail } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

const OFFSCREEN = -820;
const SAVE_THRESHOLD = 120;

/**
 * UC-12 · Post-purchase reveal: the freshly issued ticket drops in with a spring
 * and can be swiped down to "save" it into My tickets (Eventbrite-style).
 */
export function TicketRevealModal({
  visible,
  ticket,
  onSave,
}: {
  visible: boolean;
  ticket: TicketDetail;
  onSave: () => void;
}) {
  const tokens = useTokens();
  const { t } = useTranslation('tickets');
  const translateY = useSharedValue(OFFSCREEN);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = OFFSCREEN;
      opacity.value = 0;
      translateY.value = withSpring(0, { damping: 16, stiffness: 130 });
      opacity.value = withTiming(1, { duration: 240 });
    }
  }, [visible, translateY, opacity]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > SAVE_THRESHOLD || event.velocityY > 800) {
        translateY.value = withTiming(900, { duration: 220 });
        opacity.value = withTiming(0, { duration: 220 });
        runOnJS(onSave)();
      } else {
        translateY.value = withSpring(0, { damping: 16, stiffness: 130 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onSave}>
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.overlay, { backgroundColor: tokens.color.bg.canvas }]}>
          <Animated.View style={[styles.content, cardStyle]}>
            <Text style={[styles.title, { color: tokens.color.text.primary }]}>
              {t('reveal.title')}
            </Text>
            <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
              {t('reveal.subtitle')}
            </Text>

            <GestureDetector gesture={pan}>
              <Animated.View style={styles.ticketWrap}>
                <TicketView ticket={ticket} qr={ticket.qrPayload} qrSize={168} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.hintRow}>
              <MaterialCommunityIcons name="gesture-swipe-down" size={18} color={tokens.color.text.muted} />
              <Text style={[styles.hint, { color: tokens.color.text.muted }]}>
                {t('reveal.swipeToSave')}
              </Text>
            </View>

            <Pressable onPress={onSave} accessibilityRole="button" hitSlop={8}>
              <Text style={[styles.saveLink, { color: tokens.color.text.link }]}>
                {t('reveal.save')}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 380, alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 6 },
  ticketWrap: { width: '100%' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  hint: { fontSize: 13 },
  saveLink: { fontSize: 15, fontWeight: '700', paddingVertical: 6 },
});
