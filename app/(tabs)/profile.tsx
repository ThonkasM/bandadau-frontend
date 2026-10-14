import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { useMyProfile } from '@/features/profile/api';
import { useTokens } from '@/theme/theme-provider';

export default function ProfileScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('nav');
  const { t: tp } = useTranslation('profile');
  const { t: ta } = useTranslation('app');
  const router = useRouter();
  const profile = useMyProfile();

  return (
    <Screen title={t('profile')}>
      {profile.isLoading ? (
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      ) : profile.isError || !profile.data ? (
        <>
          <Text style={[styles.message, { color: tokens.color.text.muted }]}>{tp('error')}</Text>
          <Pressable
            onPress={() => profile.refetch()}
            style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={{ color: tokens.color.action.primary.fg }}>{ta('retry')}</Text>
          </Pressable>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: tokens.color.bg.muted }]}>
              <Text style={[styles.initial, { color: tokens.color.text.primary }]}>
                {profile.data.displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.name, { color: tokens.color.text.primary }]}>
              {profile.data.displayName}
            </Text>
            {profile.data.career ? (
              <Text style={[styles.career, { color: tokens.color.text.muted }]}>
                {profile.data.career}
              </Text>
            ) : null}
          </View>

          <View style={styles.stats}>
            <Stat label={tp('posts')} value={profile.data.postsCount} />
            <Stat label={tp('followers')} value={profile.data.followersCount} />
            <Stat label={tp('following')} value={profile.data.followingCount} />
          </View>

          {profile.data.bio ? (
            <Text style={[styles.bio, { color: tokens.color.text.secondary }]}>
              {profile.data.bio}
            </Text>
          ) : null}

          <View style={styles.interests}>
            {profile.data.interests.map((interest) => (
              <View
                key={interest}
                style={[styles.chip, { borderColor: tokens.color.border.default }]}>
                <Text style={{ color: tokens.color.text.primary }}>{interest}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.push('/profile/edit')}
            style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={{ color: tokens.color.action.primary.fg }}>{tp('edit')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/settings')} style={styles.link}>
            <Text style={{ color: tokens.color.text.link }}>{t('settings')}</Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const tokens = useTokens();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: tokens.color.text.primary }]}>{String(value)}</Text>
      <Text style={[styles.statLabel, { color: tokens.color.text.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 24 },
  message: { fontSize: 15, marginTop: 16 },
  content: { gap: 14, paddingBottom: 96 },
  header: { alignItems: 'center', gap: 6, marginTop: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 32, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800' },
  career: { fontSize: 14 },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  bio: { fontSize: 14.5, lineHeight: 20 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  link: { alignItems: 'center', marginTop: 8 },
});
