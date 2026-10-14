/**
 * Bandada U — logo en código (react-native-svg + react-native-reanimated).
 * Archivo generado por gen.py: la geometría sale del mismo origen que los SVG y los PNG.
 *
 *  <BandadaMark />      marca estática (un solo <Svg>, barata para headers y listas)
 *  <BandadaWordmark />  texto "Bandada U" vectorizado (no depende de ninguna fuente)
 *  <BandadaLoader />    la bandada hace "la ola"; para pantallas y botones en carga
 *  <BandadaSplash />    splash animada; mismo tamaño y centro que el splash nativo
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

export const BRAND = {
  blue: '#1238A8',
  night: '#0A1F66',
  sky: '#1A52D6',
  yellow: '#FFC21A',
  amber: '#F5A100',
  white: '#FFFFFF',
};

type BirdData = { x: number; y: number; s: number; leader: boolean; d: string };

// Canvas de 512 unidades. Todas las aves caen dentro del círculo seguro de Android (66 %).
const BIRDS: BirdData[] = [{"x": 184, "y": 161.0, "s": 1.0, "leader": false, "d": "M160.0 165.0Q172.0 143.0 184 159.0Q196.0 143.0 208.0 165.0"}, {"x": 184, "y": 218.8, "s": 1.0, "leader": false, "d": "M160.0 222.8Q172.0 200.8 184 216.8Q196.0 200.8 208.0 222.8"}, {"x": 184, "y": 276.5, "s": 1.0, "leader": false, "d": "M160.0 280.5Q172.0 258.5 184 274.5Q196.0 258.5 208.0 280.5"}, {"x": 204.2, "y": 329.0, "s": 1.0, "leader": false, "d": "M180.2 333.0Q192.2 311.0 204.2 327.0Q216.2 311.0 228.2 333.0"}, {"x": 256.0, "y": 351.0, "s": 1.0, "leader": false, "d": "M232.0 355.0Q244.0 333.0 256.0 349.0Q268.0 333.0 280.0 355.0"}, {"x": 307.8, "y": 329.0, "s": 1.0, "leader": false, "d": "M283.8 333.0Q295.8 311.0 307.8 327.0Q319.8 311.0 331.8 333.0"}, {"x": 328, "y": 276.5, "s": 1.0, "leader": false, "d": "M304.0 280.5Q316.0 258.5 328 274.5Q340.0 258.5 352.0 280.5"}, {"x": 328, "y": 218.8, "s": 1.0, "leader": false, "d": "M304.0 222.8Q316.0 200.8 328 216.8Q340.0 200.8 352.0 222.8"}, {"x": 328, "y": 161.0, "s": 1.2, "leader": true, "d": "M299.2 165.8Q313.6 139.4 328 158.6Q342.4 139.4 356.8 165.8"}];
const CROP = {"x": 152.5, "y": 140.4, "w": 212.9, "h": 222.1}; // caja ajustada de la marca
const HEAD = 18; // aire arriba para que la ola no se recorte
const WM_BOX = {"x": 7.1, "y": -71.4, "w": 514.6, "h": 72.5};
const WM_MAIN = 'M15.2 0.0Q11.3 0.0 9.2 -2.1Q7.1 -4.2 7.1 -8.1V-62.4Q7.1 -66.3 9.2 -68.4Q11.3 -70.5 15.2 -70.5H39.4Q46.9 -70.5 52.2 -68.3Q57.5 -66.1 60.2 -62.0Q63.0 -57.9 63.0 -52.2Q63.0 -45.9 59.4 -41.5Q56.7 -38.2 52.4 -36.5Q57.7 -35.0 60.9 -31.5Q64.9 -27.0 64.9 -19.9Q64.9 -10.5 58.4 -5.2Q51.9 0.0 40.5 0.0ZM21.9 -11.5H38.4Q44.4 -11.5 47.2 -13.8Q50.0 -16.2 50.0 -20.8Q50.0 -25.4 47.2 -27.7Q44.4 -30.0 38.4 -30.0H21.9ZM21.9 -41.5H36.7Q42.5 -41.5 45.3 -43.7Q48.1 -45.9 48.1 -50.3Q48.1 -54.6 45.3 -56.8Q42.5 -59.0 36.7 -59.0H21.9ZM92.9 1.1Q87.5 1.1 83.2 -1.0Q78.9 -3.1 76.5 -6.7Q74.1 -10.3 74.1 -14.8Q74.1 -20.2 76.9 -23.4Q79.7 -26.5 86.0 -27.9Q92.3 -29.2 102.7 -29.2H106.3V-30.9Q106.3 -35.3 104.3 -37.2Q102.3 -39.0 97.5 -39.0Q94.8 -39.0 91.7 -38.4Q88.5 -37.7 84.7 -36.2Q82.5 -35.2 80.8 -35.8Q79.1 -36.3 78.2 -37.8Q77.3 -39.2 77.3 -41.0Q77.3 -42.7 78.3 -44.4Q79.3 -46.0 81.6 -46.8Q86.3 -48.7 90.4 -49.4Q94.6 -50.1 98.1 -50.1Q105.8 -50.1 110.8 -47.9Q115.7 -45.6 118.2 -41.0Q120.7 -36.3 120.7 -29.0V-6.8Q120.7 -3.1 118.9 -1.1Q117.1 0.9 113.7 0.9Q110.3 0.9 108.5 -1.1Q106.6 -3.1 106.6 -6.8V-7.3Q105.9 -5.5 104.8 -4.1Q102.8 -1.6 99.8 -0.2Q96.8 1.1 92.9 1.1ZM106.3 -21.4H102.8Q97.7 -21.4 94.6 -20.9Q91.4 -20.3 90.1 -19.0Q88.7 -17.7 88.7 -15.4Q88.7 -12.6 90.7 -10.8Q92.6 -9.0 96.3 -9.0Q99.2 -9.0 101.5 -10.4Q103.7 -11.7 105.0 -14.1Q106.3 -16.4 106.3 -19.4ZM140.6 0.9Q136.9 0.9 134.9 -1.1Q133.0 -3.1 133.0 -6.8V-42.3Q133.0 -46.0 134.9 -48.0Q136.9 -49.9 140.4 -49.9Q144.0 -49.9 145.9 -48.0Q147.8 -46.0 147.8 -42.3V-41.9Q150.0 -45.4 153.6 -47.5Q158.1 -50.1 163.9 -50.1Q169.8 -50.1 173.6 -47.9Q177.4 -45.6 179.3 -41.0Q181.2 -36.5 181.2 -29.5V-6.8Q181.2 -3.1 179.2 -1.1Q177.3 0.9 173.6 0.9Q170.0 0.9 168.1 -1.1Q166.1 -3.1 166.1 -6.8V-28.8Q166.1 -33.9 164.2 -36.2Q162.4 -38.4 158.6 -38.4Q153.8 -38.4 150.9 -35.4Q148.1 -32.4 148.1 -27.4V-6.8Q148.1 0.9 140.6 0.9ZM212.6 1.1Q206.2 1.1 201.3 -2.0Q196.5 -5.1 193.8 -10.9Q191.1 -16.7 191.1 -24.6Q191.1 -32.5 193.8 -38.2Q196.5 -43.9 201.3 -47.0Q206.2 -50.1 212.6 -50.1Q218.4 -50.1 222.9 -47.3Q226.1 -45.3 227.8 -42.4V-63.7Q227.8 -67.5 229.7 -69.5Q231.6 -71.4 235.3 -71.4Q238.9 -71.4 240.9 -69.5Q242.9 -67.5 242.9 -63.7V-6.8Q242.9 -3.1 240.9 -1.1Q239.0 0.9 235.4 0.9Q231.8 0.9 229.8 -1.1Q227.9 -3.1 227.9 -6.8V-7.0Q226.3 -3.9 223.1 -1.9Q218.5 1.1 212.6 1.1ZM217.1 -10.2Q220.4 -10.2 222.8 -11.8Q225.2 -13.4 226.6 -16.6Q228.0 -19.7 228.0 -24.6Q228.0 -31.9 225.0 -35.4Q222.0 -38.8 217.1 -38.8Q213.9 -38.8 211.4 -37.3Q209.0 -35.8 207.6 -32.7Q206.3 -29.5 206.3 -24.6Q206.3 -17.3 209.3 -13.8Q212.3 -10.2 217.1 -10.2ZM272.1 1.1Q266.7 1.1 262.4 -1.0Q258.1 -3.1 255.7 -6.7Q253.3 -10.3 253.3 -14.8Q253.3 -20.2 256.1 -23.4Q258.9 -26.5 265.2 -27.9Q271.5 -29.2 281.9 -29.2H285.5V-30.9Q285.5 -35.3 283.5 -37.2Q281.5 -39.0 276.7 -39.0Q274.0 -39.0 270.9 -38.4Q267.7 -37.7 263.9 -36.2Q261.7 -35.2 260.0 -35.8Q258.3 -36.3 257.4 -37.8Q256.5 -39.2 256.5 -41.0Q256.5 -42.7 257.5 -44.4Q258.5 -46.0 260.8 -46.8Q265.5 -48.7 269.6 -49.4Q273.8 -50.1 277.3 -50.1Q285.0 -50.1 289.9 -47.9Q294.9 -45.6 297.4 -41.0Q299.9 -36.3 299.9 -29.0V-6.8Q299.9 -3.1 298.1 -1.1Q296.3 0.9 292.9 0.9Q289.5 0.9 287.6 -1.1Q285.8 -3.1 285.8 -6.8V-7.3Q285.1 -5.5 284.0 -4.1Q282.0 -1.6 279.0 -0.2Q276.0 1.1 272.1 1.1ZM285.5 -21.4H282.0Q276.9 -21.4 273.8 -20.9Q270.6 -20.3 269.2 -19.0Q267.9 -17.7 267.9 -15.4Q267.9 -12.6 269.9 -10.8Q271.8 -9.0 275.5 -9.0Q278.4 -9.0 280.6 -10.4Q282.9 -11.7 284.2 -14.1Q285.5 -16.4 285.5 -19.4ZM331.3 1.1Q324.9 1.1 320.0 -2.0Q315.2 -5.1 312.5 -10.9Q309.8 -16.7 309.8 -24.6Q309.8 -32.5 312.5 -38.2Q315.2 -43.9 320.0 -47.0Q324.9 -50.1 331.3 -50.1Q337.1 -50.1 341.6 -47.3Q344.8 -45.3 346.5 -42.4V-63.7Q346.5 -67.5 348.4 -69.5Q350.3 -71.4 354.0 -71.4Q357.6 -71.4 359.6 -69.5Q361.6 -67.5 361.6 -63.7V-6.8Q361.6 -3.1 359.6 -1.1Q357.7 0.9 354.1 0.9Q350.5 0.9 348.5 -1.1Q346.6 -3.1 346.6 -6.8V-7.0Q345.0 -3.9 341.8 -1.9Q337.2 1.1 331.3 1.1ZM335.8 -10.2Q339.1 -10.2 341.5 -11.8Q343.9 -13.4 345.3 -16.6Q346.7 -19.7 346.7 -24.6Q346.7 -31.9 343.7 -35.4Q340.7 -38.8 335.8 -38.8Q332.6 -38.8 330.1 -37.3Q327.7 -35.8 326.4 -32.7Q325.0 -29.5 325.0 -24.6Q325.0 -17.3 328.0 -13.8Q331.0 -10.2 335.8 -10.2ZM390.8 1.1Q385.4 1.1 381.1 -1.0Q376.8 -3.1 374.4 -6.7Q372.0 -10.3 372.0 -14.8Q372.0 -20.2 374.8 -23.4Q377.6 -26.5 383.9 -27.9Q390.2 -29.2 400.6 -29.2H404.2V-30.9Q404.2 -35.3 402.2 -37.2Q400.2 -39.0 395.4 -39.0Q392.7 -39.0 389.5 -38.4Q386.4 -37.7 382.6 -36.2Q380.4 -35.2 378.7 -35.8Q377.0 -36.3 376.1 -37.8Q375.2 -39.2 375.2 -41.0Q375.2 -42.7 376.2 -44.4Q377.2 -46.0 379.5 -46.8Q384.2 -48.7 388.4 -49.4Q392.5 -50.1 396.0 -50.1Q403.7 -50.1 408.6 -47.9Q413.6 -45.6 416.1 -41.0Q418.6 -36.3 418.6 -29.0V-6.8Q418.6 -3.1 416.8 -1.1Q415.0 0.9 411.6 0.9Q408.2 0.9 406.4 -1.1Q404.5 -3.1 404.5 -6.8V-7.3Q403.8 -5.5 402.7 -4.1Q400.7 -1.6 397.7 -0.2Q394.7 1.1 390.8 1.1ZM404.2 -21.4H400.7Q395.6 -21.4 392.4 -20.9Q389.3 -20.3 387.9 -19.0Q386.6 -17.7 386.6 -15.4Q386.6 -12.6 388.5 -10.8Q390.5 -9.0 394.2 -9.0Q397.1 -9.0 399.3 -10.4Q401.6 -11.7 402.9 -14.1Q404.2 -16.4 404.2 -19.4Z';
const WM_U = 'M491.3 1.1Q483.8 1.1 478.0 -0.9Q472.3 -2.8 468.4 -6.6Q464.5 -10.4 462.5 -16.2Q460.6 -21.9 460.6 -29.5V-63.5Q460.6 -67.4 462.6 -69.4Q464.6 -71.4 468.4 -71.4Q472.1 -71.4 474.1 -69.4Q476.1 -67.4 476.1 -63.5V-29.4Q476.1 -20.8 480.0 -16.5Q483.9 -12.1 491.3 -12.1Q498.7 -12.1 502.5 -16.5Q506.4 -20.8 506.4 -29.4V-63.5Q506.4 -67.4 508.4 -69.4Q510.4 -71.4 514.1 -71.4Q517.8 -71.4 519.8 -69.4Q521.7 -67.4 521.7 -63.5V-29.5Q521.7 -19.4 518.2 -12.6Q514.8 -5.7 508.0 -2.3Q501.3 1.1 491.3 1.1Z';

// Un ave centrada en una caja de 64 x 44 (se mueve y escala con transformaciones de View).
const BIRD_LOCAL = 'M8 26Q20 4 32 20Q44 4 56 26';
const BOX_W = 64;
const BOX_H = 44;

type Look = { ox: number; oy: number; k: number };

/* ------------------------------- estática ------------------------------- */

export function BandadaMark({
  size = 48,
  color = BRAND.blue,
  accent = BRAND.amber,
  style,
}: {
  size?: number; // ancho de la marca
  color?: string;
  accent?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      <Svg width={size} height={(size * CROP.h) / CROP.w} viewBox={`${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}`}>
        {BIRDS.map((b, i) => (
          <Path
            key={i}
            d={b.d}
            fill="none"
            stroke={b.leader ? accent : color}
            strokeWidth={11 * b.s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}

export function BandadaWordmark({
  width = 160,
  color = BRAND.blue,
  accent = BRAND.amber,
  style,
}: {
  width?: number;
  color?: string;
  accent?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      <Svg
        width={width}
        height={(width * WM_BOX.h) / WM_BOX.w}
        viewBox={`${WM_BOX.x} ${WM_BOX.y} ${WM_BOX.w} ${WM_BOX.h}`}
      >
        <Path d={WM_MAIN} fill={color} />
        <Path d={WM_U} fill={accent} />
      </Svg>
    </View>
  );
}

/* ------------------------------- animadas ------------------------------- */

type Mode = 'loader' | 'splash';

function Bird({
  b,
  i,
  look,
  mode,
  intro,
  color,
  accent,
}: {
  b: BirdData;
  i: number;
  look: Look;
  mode: Mode;
  intro: 'assembled' | 'scattered';
  color: string;
  accent: string;
}) {
  const reduce = useReducedMotion();
  const fly = useSharedValue(mode === 'splash' && intro === 'scattered' ? 0 : 1);
  const wave = useSharedValue(0);
  const unit = look.k * 512;

  useEffect(() => {
    if (reduce) {
      fly.value = 1;
      return;
    }
    if (mode === 'loader') {
      wave.value = withDelay(
        i * 90,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }),
            withTiming(0, { duration: 500 }),
          ),
          -1,
          false,
        ),
      );
    } else {
      if (intro === 'scattered') {
        fly.value = withDelay(i * 70, withSpring(1, { damping: 14, stiffness: 110 }));
      }
      wave.value = withDelay(
        650 + i * 60,
        withSequence(withTiming(1, { duration: 260 }), withTiming(0, { duration: 380 })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, fly.value * 2),
    transform: [
      { translateX: (1 - fly.value) * -unit * 0.45 },
      { translateY: (1 - fly.value) * unit * 0.3 - wave.value * 16 * look.k },
      { scale: b.s },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: (b.x - BOX_W / 2 - look.ox) * look.k,
          top: (b.y - BOX_H / 2 - look.oy) * look.k,
          width: BOX_W * look.k,
          height: BOX_H * look.k,
        },
        animated,
      ]}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${BOX_W} ${BOX_H}`}>
        <Path
          d={BIRD_LOCAL}
          fill="none"
          stroke={b.leader ? accent : color}
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

export function BandadaLoader({
  size = 56,
  color = BRAND.blue,
  accent = BRAND.amber,
  style,
}: {
  size?: number; // ancho de la marca
  color?: string;
  accent?: string;
  style?: ViewStyle;
}) {
  const look: Look = { ox: CROP.x, oy: CROP.y - HEAD, k: size / CROP.w };
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando"
      style={[{ width: size, height: (CROP.h + HEAD) * look.k }, style]}
    >
      {BIRDS.map((b, i) => (
        <Bird key={i} b={b} i={i} look={look} mode="loader" intro="assembled" color={color} accent={accent} />
      ))}
    </View>
  );
}

export function BandadaSplash({
  onFinish,
  onLayout,
  size = 200, // igual que imageWidth del splash nativo en app.config
  background = BRAND.night,
  intro = 'assembled', // 'assembled' = continúa el splash nativo; 'scattered' = las aves llegan volando
  duration = 2200,
  withText = true,
}: {
  onFinish?: () => void;
  onLayout?: () => void; // úsalo para ocultar el splash nativo sin parpadeo
  size?: number;
  background?: string;
  intro?: 'assembled' | 'scattered';
  duration?: number;
  withText?: boolean;
}) {
  const reduce = useReducedMotion();
  const text = useSharedValue(0);
  const look: Look = { ox: 0, oy: 0, k: size / 512 };

  useEffect(() => {
    text.value = reduce ? 1 : withDelay(800, withTiming(1, { duration: 500 }));
    const id = setTimeout(() => onFinish?.(), reduce ? 600 : duration);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: text.value,
    transform: [{ translateY: (1 - text.value) * 12 }],
  }));

  const wmWidth = CROP.w * 1.55 * look.k;
  const textTop = (CROP.y + CROP.h + 34 - 256) * look.k;

  return (
    <View
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, { backgroundColor: background, alignItems: 'center', justifyContent: 'center' }]}
    >
      <View style={{ width: size, height: size }}>
        {BIRDS.map((b, i) => (
          <Bird key={i} b={b} i={i} look={look} mode="splash" intro={intro} color={BRAND.white} accent={BRAND.yellow} />
        ))}
      </View>
      {withText && (
        <Animated.View
          style={[{ position: 'absolute', left: 0, right: 0, top: '50%', marginTop: textTop, alignItems: 'center' }, textStyle]}
        >
          <BandadaWordmark width={wmWidth} color={BRAND.white} accent={BRAND.yellow} />
        </Animated.View>
      )}
    </View>
  );
}
