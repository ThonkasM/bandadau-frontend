import { formatDate, formatTime, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { Ticket } from '@/features/tickets/types';
import { useTokens } from '@/theme/theme-provider';

const RATIO = 892 / 1215;
const BRAND_NAME = 'bandada';
const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, Menlo, monospace',
});

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
 * Eventbrite/Apple-Wallet style ticket: notched card with gradient, staggered
 * entrance, 3D tilt (interactive) and QR. Tokenized (light + dark) and i18n.
 */
export function TicketPass({
  ticket,
  qr,
  interactive = false,
  animateIn = false,
  onPress,
  onPressQr,
  style,
}: {
  ticket: Ticket;
  qr?: string;
  interactive?: boolean;
  animateIn?: boolean;
  onPress?: () => void;
  onPressQr?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('tickets');
  const locale = i18n.language as Locale;
  const gradientId = useId().replace(/:/g, 'p');
  const [size, setSize] = useState({ w: 0, h: 0 });
  const wv = useSharedValue(1);
  const hv = useSharedValue(1);
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const enter = useSharedValue(animateIn ? 800 : 0);

  useEffect(() => {
    if (animateIn) enter.value = withSpring(0, { damping: 14, stiffness: 80, mass: 1 });
  }, [animateIn, enter]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ w: width, h: height });
    wv.value = width;
    hv.value = height;
  };

  const pan = Gesture.Pan()
    .enabled(interactive)
    .onUpdate((event) => {
      ry.value = Math.max(-1, Math.min(1, (event.x - wv.value / 2) / (wv.value / 2))) * 12;
      rx.value = Math.max(-1, Math.min(1, (hv.value / 2 - event.y) / (hv.value / 2))) * 12;
    })
    .onEnd(() => {
      rx.value = withSpring(0);
      ry.value = withSpring(0);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: enter.value },
      { perspective: 900 },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
    ],
  }));

  const { w, h } = size;
  const padX = w * 0.075;
  const qrBox = w * 0.42;
  const enterDelay = (ms: number) => (animateIn ? FadeInDown.delay(ms).springify() : undefined);
  const eventName = ticket.eventTitle ?? t('ticket');
  const markLetter = BRAND_NAME.charAt(0).toUpperCase();

  const card = (
    <Animated.View
      onLayout={onLayout}
      style={[styles.card, cardStyle]}
      accessible
      accessibilityLabel={t('pass.a11y', { event: eventName })}>
      {w > 0 ? (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={tokens.color.pass.bg} />
              <Stop offset="0.55" stopColor={tokens.color.pass.bg} />
              <Stop offset="1" stopColor={tokens.color.pass['bg-2']} />
            </LinearGradient>
          </Defs>
          <Path d={passPath(w, h)} fill={`url(#${gradientId})`} />
        </Svg>
      ) : null}

      {w > 0 ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: padX,
            paddingTop: h * 0.07,
            paddingBottom: h * 0.05,
          }}>
          <Animated.View entering={enterDelay(250)} style={styles.header}>
            <View style={styles.brandRow}>
              <View style={[styles.mark, { backgroundColor: tokens.color.brand.primary }]}>
                <Text style={[styles.markText, { color: tokens.color.action.primary.fg }]}>
                  {markLetter}
                </Text>
              </View>
              <Text style={[styles.brand, { color: tokens.color.brand.primary }]}>{BRAND_NAME}</Text>
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
          </Animated.View>

          <Animated.View entering={enterDelay(350)} style={styles.field}>
            <Text style={[styles.label, { color: tokens.color.pass.muted }]}>{t('pass.event')}</Text>
            <Text style={[styles.valueBig, { color: tokens.color.pass.fg }]}>{eventName}</Text>
          </Animated.View>

          <Animated.View entering={enterDelay(450)} style={[styles.field, styles.two]}>
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
          </Animated.View>

          <Animated.View entering={enterDelay(550)} style={styles.field}>
            <Text style={[styles.label, { color: tokens.color.pass.muted }]}>{t('pass.where')}</Text>
            <Text style={[styles.address, { color: tokens.color.pass.fg }]} numberOfLines={2}>
              {ticket.venue ?? ''}
            </Text>
          </Animated.View>

          <View style={styles.qrArea}>
            <Animated.View
              entering={animateIn ? ZoomIn.delay(750).springify().damping(10) : undefined}
              style={[
                styles.qrBox,
                { width: qrBox, height: qrBox, padding: w * 0.02, backgroundColor: tokens.color.qr.bg },
              ]}>
              {qr ? (
                <Pressable
                  onPress={onPressQr}
                  disabled={!onPressQr}
                  accessibilityRole={onPressQr ? 'button' : undefined}
                  accessibilityLabel={t('tapToEnlarge')}>
                  <QRCode
                    value={qr}
                    size={qrBox - w * 0.04}
                    backgroundColor={tokens.color.qr.bg}
                    color={tokens.color.qr.fg}
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPress={onPress}
                  accessibilityRole="button"
                  style={styles.qrEmpty}>
                  <MaterialCommunityIcons name="qrcode" size={44} color={tokens.color.pass.muted} />
                  <Text style={[styles.qrEmptyText, { color: tokens.color.pass.muted }]}>
                    {t('viewQr')}
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          </View>

          <View style={[styles.icon, { left: w * 0.05, bottom: h * 0.035 }]}>
            <Text style={[styles.markText, { color: tokens.color.brand.primary }]}>{markLetter}</Text>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );

  if (interactive) {
    return (
      <View style={style}>
        <GestureDetector gesture={pan}>{card}</GestureDetector>
      </View>
    );
  }
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={style}>
        {card}
      </Pressable>
    );
  }
  return <View style={style}>{card}</View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 360, aspectRatio: RATIO, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  markText: { fontWeight: '800', fontSize: 15 },
  brand: { fontSize: 22, fontWeight: '800' },
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
  qrEmpty: { alignItems: 'center', gap: 4 },
  qrEmptyText: { fontSize: 12, fontWeight: '600' },
  icon: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
