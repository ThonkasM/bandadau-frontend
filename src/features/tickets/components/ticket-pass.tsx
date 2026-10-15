import { formatDate, formatTime, type Locale } from '@bandada/i18n';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { BandadaMark, BandadaWordmark } from '@/components/brand/BandadaLogo';
import type { Ticket } from '@/features/tickets/types';
import { useDeviceTilt } from '@/hooks/use-device-tilt';
import { useTheme, useTokens } from '@/theme/theme-provider';
import { useBrand } from '@/theme/use-brand';

const RATIO = 892 / 1215;
const PERSPECTIVE = 800;
const MAX_TILT_DEG = 14; // mismo valor que MAX_DEG en use-device-tilt.native.ts
const SPRING_FOLLOW = { damping: 20, stiffness: 200, mass: 0.5 }; // seguir al dedo/cursor
const SPRING_REST = { damping: 14, stiffness: 120, mass: 0.8 }; // volver a la posición neutra
const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, Menlo, monospace',
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Card outline: rounded corners + a semi-elliptical notch at the top center (Wallet style). */
function passPath(w: number, h: number, r = 22) {
  const cx = w / 2;
  const nw = w * 0.12;
  const nd = h * 0.033;
  return [
    `M ${r} 0`,
    `H ${cx - nw}`,
    `A ${nw} ${nd} 0 0 0 ${cx + nw} 0`,
    `H ${w - r}`,
    `Q ${w} 0 ${w} ${r}`,
    `V ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `H ${r}`,
    `Q 0 ${h} 0 ${h - r}`,
    `V ${r}`,
    `Q 0 0 ${r} 0 Z`,
  ].join(' ');
}

/**
 * Eventbrite/Apple-Wallet style ticket: notched card with gradient, whole-card
 * "printing" reveal (top-to-bottom), 3D tilt (drag / hover on web / device motion)
 * with a moving sheen, and QR. Tokenized (light + dark).
 */
export function TicketPass({
  ticket,
  qr,
  qrScale = 0.42,
  interactive = false,
  motion = false,
  animateIn = false,
  onPress,
  onPressQr,
  style,
}: {
  ticket: Ticket;
  qr?: string;
  qrScale?: number;
  interactive?: boolean;
  motion?: boolean;
  animateIn?: boolean;
  onPress?: () => void;
  onPressQr?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const tokens = useTokens();
  const brand = useBrand();
  const { effective } = useTheme();
  const isDark = effective === 'dark';
  const { t, i18n } = useTranslation('tickets');
  const locale = i18n.language as Locale;
  // React 19.1+ devuelve ids como «r0»: dejar solo [a-zA-Z0-9] para que url(#id) sea válido.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `${uid}g`;
  const sheenId = `${uid}s`;
  const clipId = `${uid}c`;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const wv = useSharedValue(1);
  const hv = useSharedValue(1);
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const dragging = useSharedValue(false);
  const enter = useSharedValue(animateIn ? 800 : 0);
  // 1 = ticket fully "printed"; animates 0 → 1 as a top-to-bottom wipe of the whole card.
  const print = useSharedValue(animateIn ? 0 : 1);
  useDeviceTilt(rx, ry, interactive && motion, dragging);

  useEffect(() => {
    if (animateIn) enter.value = withSpring(0, { damping: 18, stiffness: 150, mass: 1 });
  }, [animateIn, enter]);

  useEffect(() => {
    if (!animateIn) {
      print.value = 1;
      return;
    }
    if (size.w === 0) return;
    print.value = 0;
    print.value = withDelay(380, withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }));
  }, [animateIn, size.w, print]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ w: width, h: height });
    wv.value = width;
    hv.value = height;
  };

  const applyTilt = (x: number, y: number) => {
    'worklet';
    const ny = Math.max(-1, Math.min(1, (x - wv.value / 2) / (wv.value / 2)));
    const nx = Math.max(-1, Math.min(1, (hv.value / 2 - y) / (hv.value / 2)));
    ry.value = withSpring(ny * MAX_TILT_DEG, SPRING_FOLLOW);
    rx.value = withSpring(nx * MAX_TILT_DEG, SPRING_FOLLOW);
  };
  const resetTilt = () => {
    'worklet';
    rx.value = withSpring(0, SPRING_REST);
    ry.value = withSpring(0, SPRING_REST);
  };

  const pan = Gesture.Pan()
    .enabled(interactive)
    .onStart(() => {
      dragging.value = true;
    })
    .onUpdate((event) => applyTilt(event.x, event.y))
    .onFinalize(() => {
      dragging.value = false;
      resetTilt();
    });
  // En web el cursor inclina el ticket sin necesidad de hacer click.
  const hover = Gesture.Hover()
    .enabled(interactive && Platform.OS === 'web')
    .onUpdate((event) => applyTilt(event.x, event.y))
    .onEnd(() => resetTilt());
  const gesture = Gesture.Simultaneous(pan, hover);

  // `perspective` va PRIMERO: así la proyección se aplica a toda la cadena de transformaciones.
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: PERSPECTIVE },
      { translateY: enter.value },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
    ],
  }));

  // Brillo que se desplaza con la inclinación: es lo que hace "leer" el 3D.
  const sheenProps = useAnimatedProps(() => ({
    cx: wv.value * (0.5 - (ry.value / MAX_TILT_DEG) * 0.5),
    cy: hv.value * (0.3 + (rx.value / MAX_TILT_DEG) * 0.25),
    opacity: Math.min(1, (Math.hypot(rx.value, ry.value) / MAX_TILT_DEG) * 1.2),
  }));

  const { w, h } = size;
  const padX = w * 0.075;
  const qrBox = w * qrScale;
  const qrSize = qrBox - w * 0.04;
  // Whole-ticket "printing": the card reveals top-to-bottom (clip height 0 → h).
  const clipStyle = useAnimatedStyle(() => ({ height: print.value * h }));
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: print.value * h }],
    opacity: 1 - print.value,
  }));
  const eventName = ticket.eventTitle ?? t('ticket');
  // Sheen: soft white glow on the dark card, golden glow on the light one.
  const sheenColor = isDark ? tokens.color.pass.fg : tokens.color.brand.accent;
  const sheenOpacity = isDark ? 0.6 : 0.5;

  // `stage` NO se transforma: mide el layout y recibe los gestos. Solo `card` (hijo) rota.
  const stage = (
    <View onLayout={onLayout} style={styles.stage} collapsable={false}>
      <Animated.View
        style={[StyleSheet.absoluteFill, cardStyle]}
        accessible
        accessibilityLabel={t('pass.a11y', { event: eventName })}>
        {w > 0 ? (
          <Animated.View style={[{ width: w, height: h, overflow: 'hidden' }, clipStyle]}>
            <Svg width={w} height={h} style={styles.abs}>
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={tokens.color.pass.bg} />
                  <Stop offset="0.55" stopColor={tokens.color.pass.bg} />
                  <Stop offset="1" stopColor={tokens.color.pass['bg-2']} />
                </LinearGradient>
              <RadialGradient id={sheenId} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={sheenColor} stopOpacity={sheenOpacity} />
                <Stop offset="1" stopColor={sheenColor} stopOpacity="0" />
              </RadialGradient>
                <ClipPath id={clipId}>
                  <Path d={passPath(w, h)} />
                </ClipPath>
              </Defs>
              <Path
                d={passPath(w, h)}
                fill={`url(#${gradientId})`}
                stroke={tokens.color.border.default}
                strokeWidth={1}
              />
              <G clipPath={`url(#${clipId})`}>
                <AnimatedCircle r={w * 0.75} fill={`url(#${sheenId})`} animatedProps={sheenProps} />
              </G>
            </Svg>

            <View
              style={[
                styles.abs,
                {
                  width: w,
                  height: h,
                  paddingHorizontal: padX,
                  paddingTop: h * 0.07,
                  paddingBottom: h * 0.05,
                },
              ]}>
              <View style={styles.header}>
                <View style={styles.brandRow}>
                  <BandadaMark size={26} color={brand.color} accent={brand.accent} />
                  <BandadaWordmark width={92} color={brand.color} accent={brand.accent} />
                </View>
                <View style={styles.alignEnd}>
                  {ticket.eventStartsAt ? (
                    <>
                      <Text style={[styles.time, { color: tokens.color.pass.muted }]}>
                        {formatTime(ticket.eventStartsAt, locale)}
                      </Text>
                      <Text style={[styles.date, { color: tokens.color.pass.fg }]}>
                        {formatDate(ticket.eventStartsAt, locale, 'medium')}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: tokens.color.pass.muted }]}>
                  {t('pass.event')}
                </Text>
                <Text style={[styles.valueBig, { color: tokens.color.pass.fg }]}>{eventName}</Text>
              </View>

              <View style={[styles.field, styles.two]}>
                <View style={styles.flex}>
                  <Text style={[styles.label, { color: tokens.color.pass.muted }]}>
                    {t('pass.ticket')}
                  </Text>
                  <Text style={[styles.value, { color: tokens.color.pass.fg }]}>
                    {t(`status.${ticket.status}`)}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.label, { color: tokens.color.pass.muted }]}>
                    {t('pass.admission')}
                  </Text>
                  <Text style={[styles.value, { color: tokens.color.pass.fg }]}>
                    {ticket.eventStartsAt ? formatTime(ticket.eventStartsAt, locale) : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: tokens.color.pass.muted }]}>
                  {t('pass.where')}
                </Text>
                <Text style={[styles.address, { color: tokens.color.pass.fg }]} numberOfLines={2}>
                  {ticket.venue ?? ''}
                </Text>
              </View>

              <View style={styles.qrArea}>
                <View
                  style={[
                    styles.qrBox,
                    {
                      width: qrBox,
                      height: qrBox,
                      padding: w * 0.02,
                      backgroundColor: tokens.color.qr.bg,
                    },
                  ]}>
                  {qr ? (
                    <Pressable
                      onPress={onPressQr}
                      disabled={!onPressQr}
                      accessibilityRole={onPressQr ? 'button' : undefined}
                      accessibilityLabel={t('tapToEnlarge')}>
                      <QRCode
                        value={qr}
                        size={qrSize}
                        backgroundColor={tokens.color.qr.bg}
                        color={tokens.color.qr.fg}
                      />
                    </Pressable>
                  ) : (
                    <ActivityIndicator color={tokens.color.qr.fg} />
                  )}
                </View>
              </View>

              <View style={[styles.icon, { left: w * 0.05, bottom: h * 0.035 }]}>
                <BandadaMark size={30} color={brand.color} accent={brand.accent} />
              </View>
            </View>
          </Animated.View>
        ) : null}

        {w > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.scanline,
              { left: 0, top: 0, width: w, backgroundColor: tokens.color.brand.accent },
              scanStyle,
            ]}
          />
        ) : null}
      </Animated.View>
    </View>
  );

  if (interactive) {
    return (
      <View style={[styles.wrapper, style]}>
        <GestureDetector gesture={gesture}>{stage}</GestureDetector>
      </View>
    );
  }
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={[styles.wrapper, style]}>
        {stage}
      </Pressable>
    );
  }
  return <View style={[styles.wrapper, style]}>{stage}</View>;
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', alignItems: 'center' },
  stage: { width: '100%', maxWidth: 360, aspectRatio: RATIO, alignSelf: 'center' },
  abs: { position: 'absolute', top: 0, left: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alignEnd: { alignItems: 'flex-end' },
  time: { fontFamily: MONO, fontSize: 13 },
  date: { fontFamily: MONO, fontSize: 17 },
  field: { marginTop: 18 },
  two: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  label: { fontFamily: MONO, fontSize: 11.5, letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { fontSize: 21, fontWeight: '500' },
  valueBig: { fontSize: 25, fontWeight: '500', lineHeight: 30 },
  address: { fontSize: 14, lineHeight: 19 },
  qrArea: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  qrBox: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scanline: { position: 'absolute', height: 3, borderRadius: 2 },
  icon: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
