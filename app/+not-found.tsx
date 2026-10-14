import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useTokens } from '@/theme/theme-provider';

export default function NotFound() {
  const tokens = useTokens();
  const { t } = useTranslation('app');

  return (
    <View style={[styles.container, { backgroundColor: tokens.color.bg.canvas }]}>
      <Text style={[styles.title, { color: tokens.color.text.primary }]}>{String(404)}</Text>
      <Link href="/" style={{ color: tokens.color.text.link }}>
        {t('appName')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '800' },
});
