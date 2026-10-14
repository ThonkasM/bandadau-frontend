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
import { useTokens } from '@/theme/theme-provider';

/**
 * Instagram-style media carousel: swipeable pager with page dots.
 * On **web** it also shows left/right arrows (desktop convention).
 */
export function PostCarousel({ media }: { media: PostMedia[] }) {
  const tokens = useTokens();
  const { t } = useTranslation('feed');
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const count = media.length;

  if (count === 0) return null;

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, count - 1));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.root, { backgroundColor: tokens.color.bg.muted }]}>
      {width > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={count > 1}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onScrollEnd}
          onScrollEndDrag={onScrollEnd}>
          {media.map((mediaItem, i) => (
            <Image
              key={mediaItem.mediaId ?? i}
              source={{ uri: mediaItem.url ?? mediaItem.thumbnailUrl ?? undefined }}
              style={{ width, height: width }}
              contentFit="cover"
              transition={200}
              recyclingKey={mediaItem.mediaId ?? String(i)}
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

          {Platform.OS === 'web' ? (
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
  root: { width: '100%', aspectRatio: 1, overflow: 'hidden' },
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
