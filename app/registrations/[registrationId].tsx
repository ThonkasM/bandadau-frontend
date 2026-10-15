import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { useCancelRegistration, useRegistration } from '@/features/events/api';
import { useTokens } from '@/theme/theme-provider';

/** UC-12/13 · Registration detail: live SAGA status + cancel. */
export default function RegistrationDetailScreen() {
  const tokens = useTokens();
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{ registrationId: string }>();
  const { t } = useTranslation('events');
  const registration = useRegistration(registrationId);
  const cancel = useCancelRegistration();
  const reg = registration.data;

  const inProgress = reg?.status === 'PENDING' || reg?.status === 'CANCELLATION_PENDING';
  const cancellable = reg?.status === 'PENDING' || reg?.status === 'CONFIRMED';

  return (
    <Screen title={t('registrations.title')} showBack>
      {registration.isLoading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : reg ? (
        <View style={styles.content}>
          <Text style={[styles.title, { color: tokens.color.text.primary }]}>
            {reg.event?.title ?? ''}
          </Text>
          <Text style={[styles.status, { color: tokens.color.text.secondary }]}>
            {t(`registrations.status.${reg.status}`)}
          </Text>
          {inProgress ? (
            <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.spinner} />
          ) : null}
          {cancellable ? (
            <Button
              label={t('registrations.cancel')}
              variant="secondary"
              loading={cancel.isPending}
              onPress={() =>
                cancel.mutate(registrationId, {
                  onSuccess: () => router.push('/tickets'),
                })
              }
            />
          ) : null}
        </View>
      ) : (
        <Text style={{ color: tokens.color.text.muted }}>{t('error')}</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 24 },
  content: { gap: 10 },
  title: { fontSize: 20, fontWeight: '800' },
  status: { fontSize: 15 },
  spinner: { alignSelf: 'flex-start' },
});
