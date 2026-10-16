import type { Locale } from '@bandada/i18n';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useCreateEvent, usePublishEvent } from '@/features/events/api';
import { ApiError } from '@/lib/api-error';
import { useTokens } from '@/theme/theme-provider';

const DAY = 86_400_000;
/** Default start: a week from now (computed once at module load, not during render). */
const DEFAULT_START = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 16);

/** UC-11 · Create + publish an event (ORGANIZER). */
export default function CreateEventScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('events');
  const router = useRouter();
  const create = useCreateEvent();
  const publish = usePublishEvent();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [price, setPrice] = useState('0');
  const [startsAt, setStartsAt] = useState(DEFAULT_START);

  const busy = create.isPending || publish.isPending;
  const canSubmit = title.trim().length >= 5 && venue.trim().length >= 3 && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    try {
      const event = await create.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        startsAt: new Date(startsAt).toISOString(),
        venue: venue.trim(),
        capacity: Number(capacity) || 1,
        priceCredits: Number(price) || 0,
      });
      await publish.mutateAsync(event.id);
      router.replace(`/events/${event.id}`);
    } catch {
      // Surfaced below through the mutation error.
    }
  };

  const error = create.error ?? publish.error;
  const message = error
    ? error instanceof ApiError
      ? error.localizedMessage(i18n.language as Locale)
      : t('createError')
    : null;

  return (
    <Screen title={t('createTitle')} showBack>
      <TextField label={t('titleLabel')} value={title} onChangeText={setTitle} maxLength={120} />
      <TextField
        label={t('descriptionLabel')}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={5000}
      />
      <TextField label={t('venueLabel')} value={venue} onChangeText={setVenue} maxLength={200} />
      <TextField
        label={t('startsAtLabel')}
        value={startsAt}
        onChangeText={setStartsAt}
        autoCapitalize="none"
        helper={t('startsAtHelper')}
      />
      <TextField
        label={t('capacityLabel')}
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="number-pad"
      />
      <TextField
        label={t('priceLabel')}
        value={price}
        onChangeText={setPrice}
        keyboardType="number-pad"
        helper={t('priceHelper')}
      />

      {message ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {message}
        </Text>
      ) : null}

      <Button label={t('createSubmit')} loading={busy} disabled={!canSubmit} onPress={onSubmit} />
    </Screen>
  );
}
