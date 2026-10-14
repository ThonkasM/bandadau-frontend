import type { Locale } from '@bandada/i18n';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useResendCode, useVerifyEmail } from '@/features/auth/api';
import { verifyEmailSchema } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';
import { useTokens } from '@/theme/theme-provider';

/** UC-01: verify the 6-digit email code; on success a session is established. */
export default function VerifyEmailScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? '';
  const verify = useVerifyEmail();
  const resend = useResendCode();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const errorMessage = useMemo(() => {
    const error = verify.error;
    return error instanceof ApiError ? error.localizedMessage(i18n.language as Locale) : null;
  }, [verify.error, i18n.language]);

  const onSubmit = () => {
    const parsed = verifyEmailSchema.safeParse({ email, code });
    if (!parsed.success) return;
    verify.mutate(parsed.data, { onSuccess: () => router.replace('/(tabs)/feed') });
  };

  const onResend = () => {
    resend.mutate({ email }, { onSuccess: () => setSeconds(60) });
  };

  return (
    <Screen title={t('verify.title')} subtitle={t('verify.subtitle', { email })}>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder={t('verify.code')}
        keyboardType="number-pad"
        maxLength={6}
        style={[styles.input, { borderColor: tokens.color.border.default, color: tokens.color.text.primary }]}
      />
      {errorMessage ? (
        <Text style={{ color: tokens.color.feedback.danger.fg }}>{errorMessage}</Text>
      ) : null}
      <Pressable
        disabled={verify.isPending}
        onPress={onSubmit}
        style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
        <Text style={{ color: tokens.color.action.primary.fg }}>{t('verify.submit')}</Text>
      </Pressable>
      {seconds > 0 ? (
        <Text style={{ color: tokens.color.text.muted }}>
          {t('verify.resentIn', { seconds })}
        </Text>
      ) : (
        <Pressable disabled={resend.isPending} onPress={onResend}>
          <Text style={{ color: tokens.color.text.link }}>{t('verify.resend')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
});
