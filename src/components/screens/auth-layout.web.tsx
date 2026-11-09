import { ScrollView, StyleSheet, View } from 'react-native';

import { BrandHero } from '@/components/brand/brand-hero';
import type { AuthLayoutProps } from '@/components/screens/auth-layout';
import { useTokens } from '@/theme/theme-provider';

/**
 * Web auth layout: branded hero + centered scrollable form. No `react-native-keyboard-controller` here:
 * mobile browsers scroll the focused field into view and resize the viewport by themselves, and
 * fighting them (padding / scroll adjustments) is what makes the keyboard flicker or close.
 */
export function AuthLayout({ children, heroSubtitle, heroHeight = 180 }: AuthLayoutProps) {
  const tokens = useTokens();

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bg.canvas }]}>
      <BrandHero height={heroHeight} subtitle={heroSubtitle} paddingTop={0} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  form: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 16 },
});
