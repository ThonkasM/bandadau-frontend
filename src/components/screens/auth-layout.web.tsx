import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHero } from '@/components/brand/brand-hero';
import type { AuthLayoutProps } from '@/components/screens/auth-layout';
import { useTokens } from '@/theme/theme-provider';

/** On the web the hero is compact: a phone browser with the keyboard open leaves very little height. */
const WEB_HERO_MAX_HEIGHT = 128;

/**
 * Web auth layout. The hero and the form scroll together in ONE `ScrollView` (a fixed hero eats the
 * height that mobile browsers lose when the keyboard opens, hiding the focused field). No
 * `react-native-keyboard-controller` here: the browser scrolls the focused field into view and
 * resizes the viewport by itself; fighting it makes the keyboard flicker or close.
 */
export function AuthLayout({ children, heroSubtitle, heroHeight = 180 }: AuthLayoutProps) {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bg.canvas }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <BrandHero
          height={Math.min(heroHeight, WEB_HERO_MAX_HEIGHT)}
          subtitle={heroSubtitle}
          paddingTop={Math.max(insets.top, 20)}
        />
        <View style={styles.form}>
          <View style={styles.inner}>{children}</View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  form: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 16 },
});
