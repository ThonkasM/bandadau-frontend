import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useTokens } from '@/theme/theme-provider';

export default function WelcomeScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('auth');

  return (
    <Screen title={t('welcome.title')} subtitle={t('welcome.subtitle')}>
      <Link href="/(auth)/login" style={[styles.link, { color: tokens.color.text.link }]}>
        {t('welcome.signIn')}
      </Link>
      <Link href="/(auth)/register" style={[styles.link, { color: tokens.color.text.link }]}>
        {t('welcome.createAccount')}
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: 16, fontWeight: '600', marginTop: 8 },
});
