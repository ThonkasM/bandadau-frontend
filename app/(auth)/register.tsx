import type { Locale } from '@bandada/i18n';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AuthLayout } from '@/components/screens/auth-layout';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { PasswordField } from '@/components/ui/password-field';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useRegister, useUniversities } from '@/features/auth/api';
import { isEmailAllowed, registerSchema } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';
import { newUuid } from '@/lib/ids';
import { useTokens } from '@/theme/theme-provider';

/** P-APP-02 · Register (mockup, wired to identity; university selector). */
export default function RegisterScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const universities = useUniversities();
  const register = useRegister();

  const [universityId, setUniversityId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const idempotencyKey = useRef(newUuid());

  const selected = useMemo(
    () => universities.data?.items.find((u) => u.id === universityId),
    [universities.data, universityId],
  );
  const serverError = useMemo(() => {
    const error = register.error;
    return error instanceof ApiError ? error.localizedMessage(i18n.language as Locale) : null;
  }, [register.error, i18n.language]);

  const onSubmit = () => {
    setClientError(null);
    const parsed = registerSchema.safeParse({ universityId, displayName, email, password });
    if (!parsed.success || !selected) return;
    if (!isEmailAllowed(email, selected.allowedDomains)) {
      setClientError(t('register.domainError', { university: selected.name }));
      return;
    }
    register.mutate(
      {
        input: {
          universityId: parsed.data.universityId,
          email: parsed.data.email,
          password: parsed.data.password,
          locale: i18n.language as Locale,
        },
        idempotencyKey: idempotencyKey.current,
      },
      {
        onSuccess: () => {
          idempotencyKey.current = newUuid();
          router.push({ pathname: '/(auth)/verify-email', params: { email } });
        },
      },
    );
  };

  return (
    <AuthLayout heroHeight={170}>
      <Text variant="title">{t('register.title')}</Text>
      <Text variant="subtitle">{t('register.subtitle')}</Text>

      <View style={{ gap: 8 }}>
        <Text variant="label">{t('register.university')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(universities.data?.items ?? []).map((university) => (
            <Chip
              key={university.id}
              label={university.name}
              selected={universityId === university.id}
              onPress={() => setUniversityId(university.id)}
            />
          ))}
        </View>
      </View>

      <TextField
        label={t('register.displayName')}
        value={displayName}
        onChangeText={setDisplayName}
        autoComplete="name"
      />
      <TextField
        label={t('register.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        helper={t('register.emailHelper')}
      />
      <PasswordField
        label={t('register.password')}
        value={password}
        onChangeText={setPassword}
        helper={t('register.passwordHelper')}
      />

      {clientError ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {clientError}
        </Text>
      ) : null}
      {serverError ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {serverError}
        </Text>
      ) : null}

      <Button label={t('register.submit')} loading={register.isPending} onPress={onSubmit} />

      <Pressable onPress={() => router.push('/(auth)/login')} style={{ alignItems: 'center' }}>
        <Text variant="link">{t('register.haveAccount')}</Text>
      </Pressable>
    </AuthLayout>
  );
}
