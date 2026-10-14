import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type { PostMedia } from '@/features/feed/types';
import { useDeviceType } from '@/hooks/use-device-type';
import { DEFAULT_MEDIA_RATIO, targetRatio } from '@/lib/media-ratio';
import { useTokens } from '@/theme/theme-provider';

/**
 * Instagram-style media carousel. All slides share the ratio derived from the
 * first image's real dimensions (portrait 4:5 / landscape 1.91:1 / square 1:1)
 * and are cropped to fill it. Web **desktop** shows arrows; touch uses swipe.
 */
export function PostCarousel({ media }: { media: PostMedia[] }) {
  const tokens = useTokens();
  const { t } = useTranslation('feed');
  const { isWebDesktop } = useDeviceType();
  const [width, setWidth] = useState(0);
  const [ratio, setRatio] = useState<number>(DEFAULT_MEDIA_RATIO);
  const ratioLocked = useRef(false);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const count = media.length;

  if (count === 0) return null;

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const slideHeight = width / ratio;

  const handleFirstLoad = (i: number) => (event: unknown) => {
    if (i !== 0 || ratioLocked.current) return;
    const source = (event as { source?: { width?: number; height?: number } }).source;
    if (source?.width && source?.height) {
      ratioLocked.current = true;
      setRatio(targetRatio(source.width, source.height).ratio);
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex((prev) => (prev === next ? prev : next));
  };

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, count - 1));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.root, { aspectRatio: ratio, backgroundColor: tokens.color.bg.muted }]}>
      {width > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={count > 1}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}>
          {media.map((mediaItem, i) => (
            <Image
              key={mediaItem.mediaId ?? i}
              source={{ uri: mediaItem.url ?? mediaItem.thumbnailUrl ?? undefined }}
              style={{ width, height: slideHeight }}
              contentFit="cover"
              transition={200}
              recyclingKey={mediaItem.mediaId ?? String(i)}
              onLoad={handleFirstLoad(i)}
            />
          ))}
        </ScrollView>
      ) : null}

      {count > 1 ? (
        <>
          <View style={styles.dots} pointerEvents="none">
            {media.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === index
                    ? { backgroundColor: tokens.color.brand.accent }
                    : { backgroundColor: tokens.color.bg.surface, opacity: 0.6 },
                ]}
              />
            ))}
          </View>

          {isWebDesktop ? (
            <>
              {index > 0 ? (
                <Arrow
                  side="left"
                  background={tokens.color.bg.surface}
                  icon={tokens.color.text.primary}
                  label={t('previous')}
                  onPress={() => goTo(index - 1)}
                />
              ) : null}
              {index < count - 1 ? (
                <Arrow
                  side="right"
                  background={tokens.color.bg.surface}
                  icon={tokens.color.text.primary}
                  label={t('next')}
                  onPress={() => goTo(index + 1)}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function Arrow({
  side,
  background,
  icon,
  label,
  onPress,
}: {
  side: 'left' | 'right';
  background: string;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.arrow,
        side === 'left' ? styles.arrowLeft : styles.arrowRight,
        { backgroundColor: background },
      ]}>
      <MaterialCommunityIcons
        name={side === 'left' ? 'chevron-left' : 'chevron-right'}
        size={26}
        color={icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', overflow: 'hidden' },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.92,
    ...Platform.select({
      web: { cursor: 'pointer' } as object,
      default: {},
    }),
  },
  arrowLeft: { left: 10 },
  arrowRight: { right: 10 },
});
