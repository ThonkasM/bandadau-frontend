import { formatCredits, formatDate, type Locale } from '@bandada/i18n';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { useEvent, useRegisterToEvent } from '@/features/events/api';
import { newUuid } from '@/lib/ids';
import { useTokens } from '@/theme/theme-provider';

/** UC-12 · Event detail + register (mockup, wired to events-service). */
export default function EventDetailScreen() {
  const tokens = useTokens();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation('events');
  const { t: ta } = useTranslation('app');
  const locale = i18n.language as Locale;
  const event = useEvent(id);
  const register = useRegisterToEvent();
  const idempotencyKey = useRef(newUuid());

  if (event.isLoading) {
    return (
      <Screen title={t('title')}>
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      </Screen>
    );
  }

  if (event.isError || !event.data) {
    return (
      <Screen title={t('title')}>
        <Text style={{ color: tokens.color.text.muted }}>{ta('retry')}</Text>
      </Screen>
    );
  }

  const data = event.data;
  const price = data.priceCredits === 0 ? ta('free') : formatCredits(data.priceCredits, locale);

  return (
    <Screen title={data.title}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={{ uri: `https://picsum.photos/seed/bandada-event-${data.id}/1200/675` }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
        <Text style={{ color: tokens.color.text.muted }}>
          {formatDate(data.startsAt, locale, 'long')}
        </Text>
        <Text style={{ color: tokens.color.text.muted }}>{data.venue}</Text>
        <Text style={{ color: tokens.color.text.primary }}>{data.description}</Text>
        <View style={styles.row}>
          <Text style={[styles.price, { color: tokens.color.text.primary }]}>{price}</Text>
          <Text style={{ color: tokens.color.text.muted }}>{t('seats', { count: data.seatsAvailable })}</Text>
        </View>

        {register.data ? (
          <Text style={{ color: tokens.color.feedback.success.fg }}>{t('registered')}</Text>
        ) : (
          <Button
            label={t('register')}
            loading={register.isPending}
            onPress={() =>
              register.mutate({ eventId: data.id, idempotencyKey: idempotencyKey.current })
            }
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingBottom: 24 },
  cover: { height: 160, borderRadius: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  price: { fontSize: 18, fontWeight: '800' },
  center: { marginTop: 24 },
});
