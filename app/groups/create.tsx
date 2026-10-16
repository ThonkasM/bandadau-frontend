import type { Locale } from '@bandada/i18n';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useCreateGroup } from '@/features/groups/api';
import type { GroupPrivacy } from '@/features/groups/types';
import { ApiError } from '@/lib/api-error';
import { useTokens } from '@/theme/theme-provider';

/** UC-09 · Create a study group. */
export default function CreateGroupScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('groups');
  const router = useRouter();
  const create = useCreateGroup();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [privacy, setPrivacy] = useState<GroupPrivacy>('PUBLIC');

  const canSubmit = name.trim().length >= 3 && subject.trim().length >= 2 && !create.isPending;
  const error = create.error
    ? create.error instanceof ApiError
      ? create.error.localizedMessage(i18n.language as Locale)
      : t('createError')
    : null;

  const onSubmit = () => {
    if (!canSubmit) return;
    create.mutate(
      { name: name.trim(), subject: subject.trim(), privacy },
      { onSuccess: (group) => router.replace(`/groups/${group.id}`) },
    );
  };

  return (
    <Screen title={t('create')} showBack>
      <TextField label={t('name')} value={name} onChangeText={setName} maxLength={80} />
      <TextField label={t('subject')} value={subject} onChangeText={setSubject} maxLength={80} />

      <Text variant="label">{t('privacyLabel')}</Text>
      <View style={styles.row}>
        {(['PUBLIC', 'PRIVATE'] as GroupPrivacy[]).map((option) => (
          <Chip
            key={option}
            label={t(`privacy.${option}`)}
            selected={privacy === option}
            onPress={() => setPrivacy(option)}
          />
        ))}
      </View>

      {error ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {error}
        </Text>
      ) : null}

      <Button label={t('create')} loading={create.isPending} disabled={!canSubmit} onPress={onSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
