import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useMyProfile, useUpdateProfile } from '@/features/profile/api';
import { useTokens } from '@/theme/theme-provider';

/** UC-04: edit academic profile. `universityId` is read-only (server-owned). */
export default function EditProfileScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('profile');
  const { t: ta } = useTranslation('app');
  const router = useRouter();
  const current = useMyProfile();
  const update = useUpdateProfile();

  const [displayName, setDisplayName] = useState(current.data?.displayName ?? '');
  const [career, setCareer] = useState(current.data?.career ?? '');
  const [semester, setSemester] = useState(
    current.data?.semester ? String(current.data.semester) : '',
  );
  const [bio, setBio] = useState(current.data?.bio ?? '');
  const [interests, setInterests] = useState((current.data?.interests ?? []).join(', '));

  const onSave = () => {
    update.mutate(
      {
        displayName: displayName.trim() || undefined,
        career: career.trim() || null,
        semester: semester.trim() ? Number(semester) : null,
        bio: bio.trim() || null,
        interests: interests
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      },
      { onSuccess: () => router.back() },
    );
  };

  const field = { borderColor: tokens.color.border.default, color: tokens.color.text.primary };

  return (
    <Screen title={t('edit')}>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('displayName')}
          style={[styles.input, field]}
        />
        <TextInput
          value={career}
          onChangeText={setCareer}
          placeholder={t('career')}
          style={[styles.input, field]}
        />
        <TextInput
          value={semester}
          onChangeText={setSemester}
          placeholder={t('semester')}
          keyboardType="number-pad"
          style={[styles.input, field]}
        />
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder={t('bio')}
          multiline
          style={[styles.input, styles.multiline, field]}
        />
        <TextInput
          value={interests}
          onChangeText={setInterests}
          placeholder={t('interests')}
          style={[styles.input, field]}
        />
        <Pressable
          disabled={update.isPending}
          onPress={onSave}
          style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
          <Text style={{ color: tokens.color.action.primary.fg }}>{ta('save')}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 24 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
});
