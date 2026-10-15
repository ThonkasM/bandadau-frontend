import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useTokens } from '@/theme/theme-provider';

/** Translated fallback for render errors (used by the route/root ErrorBoundary). */
export function AppError({ onRetry }: { onRetry: () => void }) {
  const tokens = useTokens();
  const { t } = useTranslation('app');
  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bg.canvas }]}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={48}
        color={tokens.color.feedback.danger.fg}
      />
      <Text style={[styles.title, { color: tokens.color.text.primary }]}>{t('errorTitle')}</Text>
      <Text style={[styles.message, { color: tokens.color.text.muted }]}>{t('errorMessage')}</Text>
      <View style={styles.action}>
        <Button label={t('retry')} onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 15, textAlign: 'center' },
  action: { alignSelf: 'stretch', maxWidth: 280, marginTop: 8 },
});
