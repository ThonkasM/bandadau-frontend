import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const loginAsGuest = useSessionStore((s) => s.loginAsGuest);

  const onGuest = () => {
    loginAsGuest();
    router.replace('/(tabs)/feed');
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: tokens.color.bg.canvas }]}>
      <BrandHero height={280} />

      <View style={styles.content}>
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
            variant="ghost"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  center: { textAlign: 'center' },
  guestLink: { alignItems: 'center' },
  actions: { gap: 12, marginTop: 4 },
});
