import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import type { LoginResponse } from '@/features/auth/types';
import { ApiError } from '@/lib/api-error';
import { apiRequest } from '@/lib/api-client';
import { useSessionStore, type SessionUser } from '@/stores/session.store';
import { useTokens } from '@/theme/theme-provider';

export default function LoginScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('auth');
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password, clientApp: 'APP' },
      });
      setSession({ accessToken: data.accessToken, user: data.user as SessionUser });
      router.replace('/(tabs)/feed');
    } catch (err) {
      setError(err instanceof ApiError ? err.localizedMessage('es') : 'INTERNAL_ERROR');
    } finally {
      setLoading(false);
    }
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
      {error ? <Text style={{ color: tokens.color.feedback.danger.fg }}>{error}</Text> : null}
      <Pressable
        disabled={loading}
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
