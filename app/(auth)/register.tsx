import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useTokens } from '@/theme/theme-provider';

/**
 * UC-01 registration. The full form (universities + domain validation +
 * Idempotency-Key) lands in Fase B; this route already exists for navigation.
 */
export default function RegisterScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('auth');
  return (
    <Screen title={t('register.title')}>
      <Link href="/(auth)/verify-email" style={[styles.link, { color: tokens.color.text.link }]}>
        {t('register.submit')}
      </Link>
      <Link href="/(auth)/login" style={{ color: tokens.color.text.link }}>
        {t('register.haveAccount')}
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({ link: { fontSize: 16, fontWeight: '600', marginTop: 8 } });
