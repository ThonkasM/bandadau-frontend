import type { Locale } from '@bandada/i18n';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { AuthScaffold } from '@/components/screens/auth-scaffold';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useResendCode, useVerifyEmail } from '@/features/auth/api';
import { verifyEmailSchema } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';
import { useTokens } from '@/theme/theme-provider';

/** P-APP-03 · Verify email (mockup, wired to identity). */
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
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
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

  return (
    <AuthScaffold>
      <Text variant="title">{t('verify.title')}</Text>
      <Text variant="subtitle">{t('verify.subtitle', { email })}</Text>

      <TextField
        label={t('verify.code')}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.code}
        helper={t('verify.codeHelper')}
      />

      {errorMessage ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {errorMessage}
        </Text>
      ) : null}

      <Button label={t('verify.submit')} loading={verify.isPending} onPress={onSubmit} />

      {seconds > 0 ? (
        <Text variant="caption" style={styles.center}>
          {t('verify.resentIn', { seconds })}
        </Text>
      ) : (
        <Pressable
          disabled={resend.isPending}
          onPress={() => resend.mutate({ email }, { onSuccess: () => setSeconds(60) })}
          style={styles.center}>
          <Text variant="link">{t('verify.resend')}</Text>
        </Pressable>
      )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  code: { letterSpacing: 8, textAlign: 'center', fontSize: 22 },
  center: { alignItems: 'center' },
});
