import type { Locale } from '@bandada/i18n';
import { Link, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useRegister, useUniversities } from '@/features/auth/api';
import { isEmailAllowed, registerSchema } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api-error';
import { newUuid } from '@/lib/ids';
import { useTokens } from '@/theme/theme-provider';

/** UC-01: register with institutional email + verification. */
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

  // One Idempotency-Key per registration intent (reused on retry, UC-01 6a).
  const idempotencyKey = useRef(newUuid());

  const selected = useMemo(
    () => universities.data?.items.find((u) => u.id === universityId),
    [universities.data, universityId],
  );

  const serverError = useMemo(() => {
    const error = register.error;
    if (!error) return null;
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
    <Screen title={t('register.title')}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={{ color: tokens.color.text.muted }}>{t('register.university')}</Text>
        <View style={styles.unis}>
          {(universities.data?.items ?? []).map((university) => (
            <Pressable
              key={university.id}
              onPress={() => setUniversityId(university.id)}
              style={[
                styles.chip,
                { borderColor: tokens.color.border.default },
                universityId === university.id && { backgroundColor: tokens.color.bg.muted },
              ]}>
              <Text style={{ color: tokens.color.text.primary }}>{university.name}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('register.displayName')}
          style={[styles.input, { borderColor: tokens.color.border.default, color: tokens.color.text.primary }]}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('register.email')}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor: tokens.color.border.default, color: tokens.color.text.primary }]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('register.password')}
          secureTextEntry
          style={[styles.input, { borderColor: tokens.color.border.default, color: tokens.color.text.primary }]}
        />

        {clientError ? (
          <Text style={{ color: tokens.color.feedback.danger.fg }}>{clientError}</Text>
        ) : null}
        {serverError ? <Text style={{ color: tokens.color.feedback.danger.fg }}>{serverError}</Text> : null}

        <Pressable
          disabled={register.isPending}
          onPress={onSubmit}
          style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
          <Text style={{ color: tokens.color.action.primary.fg }}>{t('register.submit')}</Text>
        </Pressable>
        <Link href="/(auth)/login" style={{ color: tokens.color.text.link }}>
          {t('register.haveAccount')}
        </Link>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 10, paddingBottom: 24 },
  unis: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
});
