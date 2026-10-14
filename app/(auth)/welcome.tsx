import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHero } from '@/components/brand/brand-hero';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSessionStore } from '@/stores/session.store';
import { useTokens } from '@/theme/theme-provider';

/** P-APP-01 · Welcome (branded hero + CTAs). */
export default function WelcomeScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const loginAsGuest = useSessionStore((s) => s.loginAsGuest);

  const onGuest = () => {
    loginAsGuest();
    router.replace('/(tabs)/feed');
  };

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bg.canvas }]}>
      <BrandHero height={240} paddingTop={insets.top} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <Text variant="title" style={styles.center}>
            {t('welcome.title')}
          </Text>
          <Text variant="subtitle" style={styles.center}>
            {t('welcome.pitch')}
          </Text>

          <View style={styles.actions}>
            <Button
              label={t('welcome.createAccount')}
              icon="account-plus-outline"
              onPress={() => router.push('/(auth)/register')}
            />
            <Button
              label={t('welcome.signIn')}
              variant="secondary"
              icon="login-variant"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>

          <Pressable onPress={onGuest} style={styles.guestLink}>
            <Text variant="link">{t('welcome.guest')}</Text>
          </Pressable>

          <Text variant="caption" style={styles.center}>
            {t('welcome.terms')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 24 },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 16 },
  center: { textAlign: 'center' },
  actions: { gap: 12, marginTop: 4 },
  guestLink: { alignItems: 'center' },
});
