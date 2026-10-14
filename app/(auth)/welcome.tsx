import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BandadaMark } from '@/components/brand/BandadaLogo';
import { AuthScaffold } from '@/components/screens/auth-scaffold';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useBrand } from '@/theme/use-brand';

/** P-APP-01 · Welcome (mockup). */
export default function WelcomeScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const brand = useBrand();

  return (
    <AuthScaffold>
      <View style={styles.hero}>
        <BandadaMark size={104} color={brand.color} accent={brand.accent} />
        <Text variant="display">{t('welcome.brand')}</Text>
        <Text variant="subtitle" style={styles.center}>
          {t('welcome.subtitle')}
        </Text>
        <Text variant="body" style={styles.center}>
          {t('welcome.pitch')}
        </Text>
      </View>

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

      <Text variant="caption" style={styles.center}>
        {t('welcome.terms')}
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, marginBottom: 8 },
  center: { textAlign: 'center' },
});
