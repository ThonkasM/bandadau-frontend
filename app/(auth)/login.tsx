import type { Locale } from '@bandada/i18n';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useLogin } from '@/features/auth/api';
import { loginSchema } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';
import { useTokens } from '@/theme/theme-provider';

export default function LoginScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const errorMessage = useMemo(() => {
    const error = login.error;
    if (!error) return null;
    if (error instanceof ApiError) return error.localizedMessage(i18n.language as Locale);
    return null;
  }, [login.error, i18n.language]);

  const onSubmit = () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return;
    login.mutate(parsed.data, { onSuccess: () => router.replace('/(tabs)/feed') });
  };

  return (
    <Screen title={t('login.title')}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t('login.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { borderColor: tokens.color.border.default, color: tokens.color.text.primary }]}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t('login.password')}
        secureTextEntry
        style={[styles.input, { borderColor: tokens.color.border.default, color: tokens.color.text.primary }]}
      />
      {errorMessage ? (
        <Text style={{ color: tokens.color.feedback.danger.fg }}>{errorMessage}</Text>
      ) : null}
      <Pressable
        disabled={login.isPending}
        onPress={onSubmit}
        style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
        <Text style={{ color: tokens.color.action.primary.fg }}>{t('login.submit')}</Text>
      </Pressable>
      <Link href="/(auth)/register" style={{ color: tokens.color.text.link }}>
        {t('login.noAccount')}
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
});
