import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AuthScaffold } from '@/components/screens/auth-scaffold';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/** P-APP-01 · Welcome (mockup). */
export default function WelcomeScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();

  return (
    <AuthScaffold>
      <View style={{ gap: 10 }}>
        <Text variant="display">{t('welcome.brand')}</Text>
        <Text variant="subtitle">{t('welcome.subtitle')}</Text>
        <Text variant="body">{t('welcome.pitch')}</Text>
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

      <Text variant="caption" style={{ textAlign: 'center' }}>
        {t('welcome.terms')}
      </Text>
    </AuthScaffold>
  );
}
