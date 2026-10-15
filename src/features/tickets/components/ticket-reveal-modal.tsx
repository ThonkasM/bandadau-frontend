import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LayoutChangeEvent, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { TicketPass } from '@/features/tickets/components/ticket-pass';
import { useTicketSounds } from '@/features/tickets/hooks/use-ticket-sounds';
import type { TicketDetail } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

const SAVE_THRESHOLD = 110;
const LEAVE_MS = 280;
const SLOT_H = 16;
const GLOW_H = 16;

// Línea de tiempo (ms)
const SLOT_IN_MS = 260; // aparece la ranura
const FEED_DELAY = 320; // empieza a salir el papel
const FEED_MS = 1500; // el ticket sale de la ranura, a "tirones"
const FEED_STEPS = 14; // cantidad de tirones
const QR_DELAY = FEED_DELAY + FEED_MS + 100;
const QR_MS = 800; // el QR se imprime de arriba hacia abajo
const DONE_MS = QR_DELAY + QR_MS;

/**
 * Easing "impresora": avanza en pasos discretos; cada paso arranca rápido y frena
 * (ease-out), así el papel sale a tirones en vez de deslizarse de forma continua.
 */
const stepped = (steps: number, softness: number) => (t: number) => {
  'worklet';
  const k = t * steps;
  const i = Math.floor(k);
  const f = k - i;
  const eased = 1 - Math.pow(1 - f, softness);
  return Math.min(1, (i + eased) / steps);
};
const feedEasing = stepped(FEED_STEPS, 3);
const qrEasing = stepped(26, 2);

/**
 * UC-12 · Post-purchase reveal: the ticket is "printed" out of a slot (staccato feed,
 * slight paper jitter), the QR prints top-to-bottom with a scan line, and the ticket
 * can then be swiped down to save it into My tickets.
 *
 * `onTick` (opcional) se llama en cada tirón del papel: úsalo para háptica,
 * p. ej. `onTick={() => Haptics.selectionAsync()}`.
 */
export function TicketRevealModal({
  visible,
  ticket,
  onSave,
  onTick,
}: {
  visible: boolean;
  ticket: TicketDetail;
  onSave: () => void;
  onTick?: () => void;
}) {
  const tokens = useTokens();
  const { t } = useTranslation('tickets');
  const reduceMotion = useReducedMotion();
  const [slotW, setSlotW] = useState(0);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const slotGradId = `${uid}sg`;
  const glowGradId = `${uid}gg`;
  const sounds = useTicketSounds();

  const translateY = useSharedValue(0); // swipe / salida
  const opacity = useSharedValue(0); // título y subtítulo
  const bg = useSharedValue(0);
  const slot = useSharedValue(0);
  const feed = useSharedValue(0); // 0 → 1: cuánto papel ha salido
  const qrReveal = useSharedValue(0); // 0 → 1: cuánto QR se ha impreso
  const settle = useSharedValue(0); // pulso al terminar de imprimir
  const ui = useSharedValue(0); // pista y "guardar"
  const winH = useSharedValue(700); // alto de la ventana (se mide en layout)

  useEffect(() => {
    if (!visible) return;
    translateY.value = 0;
    opacity.value = 0;
    bg.value = 0;
    slot.value = 0;
    feed.value = 0;
    qrReveal.value = 0;
    settle.value = 0;
    ui.value = 0;

    bg.value = withTiming(1, { duration: 220 });
    opacity.value = withTiming(1, { duration: 240 });

    if (reduceMotion) {
      feed.value = 1;
      qrReveal.value = 1;
      ui.value = 1;
      sounds.confirm();
      return;
    }

    slot.value = withSequence(
      withTiming(1, { duration: SLOT_IN_MS }),
      withDelay(FEED_DELAY + FEED_MS - SLOT_IN_MS + 150, withTiming(0, { duration: 300 })),
    );
    feed.value = withDelay(FEED_DELAY, withTiming(1, { duration: FEED_MS, easing: feedEasing }));
    settle.value = withDelay(
      FEED_DELAY + FEED_MS,
      withSequence(withTiming(1, { duration: 90 }), withSpring(0, { damping: 7, stiffness: 260 })),
    );
    qrReveal.value = withDelay(QR_DELAY, withTiming(1, { duration: QR_MS, easing: qrEasing }));
    ui.value = withDelay(DONE_MS, withTiming(1, { duration: 250 }));

    // Sonidos sincronizados con la línea de tiempo de la animación.
    const timers = [
      setTimeout(sounds.feed, FEED_DELAY),
      setTimeout(sounds.qr, QR_DELAY),
      setTimeout(sounds.confirm, DONE_MS),
    ];
    return () => {
      for (const id of timers) clearTimeout(id);
      sounds.stop();
    };
  }, [visible, reduceMotion, sounds, translateY, opacity, bg, slot, feed, qrReveal, settle, ui]);

  const tick = () => onTick?.();
  useAnimatedReaction(
    () => Math.floor(feed.value * FEED_STEPS),
    (current, previous) => {
      if (current > 0 && current !== previous) runOnJS(tick)();
    },
  );

  const leave = (after: () => void) => {
    translateY.value = withTiming(900, { duration: LEAVE_MS, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: LEAVE_MS });
    bg.value = withTiming(0, { duration: LEAVE_MS }, (finished) => {
      'worklet';
      if (finished) runOnJS(after)();
    });
  };

  // El swipe para guardar solo se habilita cuando el ticket terminó de salir.
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (feed.value < 1) return;
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (feed.value < 1) return;
      if (event.translationY > SAVE_THRESHOLD || event.velocityY > 700) {
        runOnJS(leave)(onSave);
      } else {
        translateY.value = withSpring(0, { damping: 16, stiffness: 130 });
      }
    });

  const onWindowLayout = (event: LayoutChangeEvent) => {
    winH.value = event.nativeEvent.layout.height;
  };
  const onSlotLayout = (event: LayoutChangeEvent) => setSlotW(event.nativeEvent.layout.width);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: bg.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
  const headStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const slotStyle = useAnimatedStyle(() => ({
    opacity: slot.value,
    transform: [{ scaleX: 0.92 + 0.08 * slot.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, feed.value * 10, (1 - feed.value) * 10)),
  }));
  // El papel sale: sube de -alto a 0 dentro de la ventana, con una pequeña vibración por tirón.
  const feedStyle = useAnimatedStyle(() => {
    const k = feed.value * FEED_STEPS;
    const f = k - Math.floor(k);
    const printing = feed.value > 0 && feed.value < 1;
    const jitter = printing && f < 0.4 ? Math.sin((f / 0.4) * Math.PI) * 0.9 : 0;
    return {
      transform: [{ translateY: -(1 - feed.value) * winH.value }, { translateX: jitter }],
    };
  });
  const settleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + settle.value * 0.03 }],
  }));
  const uiStyle = useAnimatedStyle(() => ({
    opacity: ui.value,
    transform: [{ translateY: (1 - ui.value) * 8 }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onSave}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View
          style={[styles.overlay, { backgroundColor: tokens.color.bg.canvas }, overlayStyle]}>
          <Animated.View style={[styles.content, contentStyle]}>
            <Animated.View style={[styles.head, headStyle]}>
              <Text style={[styles.title, { color: tokens.color.text.primary }]}>
                {t('reveal.title')}
              </Text>
              <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
                {t('reveal.subtitle')}
              </Text>
            </Animated.View>

            <GestureDetector gesture={pan}>
              <Animated.View style={[styles.ticketWrap, settleStyle]}>
                {/* Ranura de la impresora: el ticket sale por debajo de ella. */}
                <Animated.View
                  pointerEvents="none"
                  onLayout={onSlotLayout}
                  style={[styles.slot, slotStyle]}>
                  {slotW > 0 ? (
                    <Svg width={slotW} height={SLOT_H} style={styles.slotBg}>
                      <Defs>
                        <LinearGradient id={slotGradId} x1="0" y1="0" x2="1" y2="0">
                          <Stop offset="0" stopColor={tokens.color.brand.primary} />
                          <Stop offset="0.55" stopColor={tokens.color.brand.primary} />
                          <Stop offset="1" stopColor={tokens.color.brand.accent} />
                        </LinearGradient>
                      </Defs>
                      <Rect
                        x="0"
                        y="0"
                        width={slotW}
                        height={SLOT_H}
                        rx={SLOT_H / 2}
                        fill={`url(#${slotGradId})`}
                      />
                    </Svg>
                  ) : null}

                  <View style={[styles.slit, { backgroundColor: tokens.color.bg.canvas }]} />

                  <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]}>
                    {slotW > 0 ? (
                      <Svg width={slotW} height={GLOW_H}>
                        <Defs>
                          <LinearGradient id={glowGradId} x1="0" y1="0" x2="1" y2="0">
                            <Stop
                              offset="0"
                              stopColor={tokens.color.brand.accent}
                              stopOpacity="0"
                            />
                            <Stop
                              offset="0.5"
                              stopColor={tokens.color.brand.accent}
                              stopOpacity="0.9"
                            />
                            <Stop
                              offset="1"
                              stopColor={tokens.color.brand.accent}
                              stopOpacity="0"
                            />
                          </LinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width={slotW} height={GLOW_H} fill={`url(#${glowGradId})`} />
                      </Svg>
                    ) : null}
                  </Animated.View>
                </Animated.View>

                {/* Ventana: recorta el papel en el borde de la ranura. */}
                <View style={styles.window} onLayout={onWindowLayout}>
                  <Animated.View style={feedStyle}>
                    <TicketPass ticket={ticket} qr={ticket.qrPayload} qrReveal={qrReveal} />
                  </Animated.View>
                </View>
              </Animated.View>
            </GestureDetector>

            <Animated.View style={[styles.footer, uiStyle]}>
              <View style={styles.hintRow}>
                <MaterialCommunityIcons
                  name="gesture-swipe-down"
                  size={18}
                  color={tokens.color.text.muted}
                />
                <Text style={[styles.hint, { color: tokens.color.text.muted }]}>
                  {t('reveal.swipeToSave')}
                </Text>
              </View>

              <Pressable onPress={() => leave(onSave)} accessibilityRole="button" hitSlop={8}>
                <Text style={[styles.saveLink, { color: tokens.color.text.link }]}>
                  {t('reveal.save')}
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 380, alignItems: 'center', gap: 10 },
  head: { alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center' },
  ticketWrap: { width: '100%' },
  window: { overflow: 'hidden' },
  slot: {
    position: 'absolute',
    top: -10,
    left: -14,
    right: -14,
    height: SLOT_H,
    zIndex: 2,
    justifyContent: 'center',
  },
  slotBg: { position: 'absolute', top: 0, left: 0 },
  slit: { height: 4, borderRadius: 2, marginHorizontal: 7 },
  glow: { position: 'absolute', left: 0, right: 0, top: SLOT_H - 2 },
  footer: { alignItems: 'center', gap: 4, marginTop: 6 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  hint: { fontSize: 13 },
  saveLink: { fontSize: 15, fontWeight: '700', paddingVertical: 6 },
});