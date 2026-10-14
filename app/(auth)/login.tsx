import type { Locale } from '@bandada/i18n';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { AuthLayout } from '@/components/screens/auth-layout';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useLogin } from '@/features/auth/api';
import { loginSchema } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';
import { useTokens } from '@/theme/theme-provider';

/** P-APP-04 · Login (branded hero + form, wired to identity). */
export default function LoginScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const errorMessage = useMemo(() => {
    const error = login.error;
    return error instanceof ApiError ? error.localizedMessage(i18n.language as Locale) : null;
  }, [login.error, i18n.language]);

  const onSubmit = () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return;
    login.mutate(parsed.data, { onSuccess: () => router.replace('/(tabs)/feed') });
  };

  return (
    <AuthLayout heroSubtitle={t('welcome.subtitle')}>
      <Text variant="title">{t('login.title')}</Text>
      <Text variant="subtitle">{t('login.subtitle')}</Text>

      <TextField
        label={t('login.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        label={t('login.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      {errorMessage ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {errorMessage}
        </Text>
      ) : null}

      <Button label={t('login.submit')} loading={login.isPending} onPress={onSubmit} />

      <Pressable onPress={() => router.push('/(auth)/register')} style={styles.link}>
        <Text variant="link">{t('login.noAccount')}</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  link: { alignItems: 'center' },
});
