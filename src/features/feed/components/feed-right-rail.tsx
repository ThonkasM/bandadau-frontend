import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMyProfile } from '@/features/profile/api';
import { useTokens } from '@/theme/theme-provider';

const SUGGESTIONS = [
  { id: '1', name: 'Sofía Quispe', subtitle: 'Ingeniería de Software' },
  { id: '2', name: 'Diego Flores', subtitle: 'Arquitectura' },
  { id: '3', name: 'Valeria Gómez', subtitle: 'Derecho' },
];

function Avatar({ name, muted }: { name: string; muted: boolean }) {
  const tokens = useTokens();
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: muted ? tokens.color.bg.muted : tokens.color.brand.primary },
      ]}>
      <Text
        style={[
          styles.initial,
          { color: muted ? tokens.color.text.primary : tokens.color.action.primary.fg },
        ]}>
        {name.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

/** Web right rail: own profile + "suggestions" (uses the horizontal space on desktop). */
export function FeedRightRail() {
  const tokens = useTokens();
  const { t } = useTranslation('feed');
  const profile = useMyProfile();

  return (
    <View style={styles.rail}>
      <View style={styles.profileRow}>
        <Avatar name={profile.data?.displayName ?? ''} muted={false} />
        <View style={styles.profileText}>
          <Text style={[styles.name, { color: tokens.color.text.primary }]}>
            {profile.data?.displayName ?? ''}
          </Text>
          <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
            {profile.data?.career ?? ''}
          </Text>
        </View>
      </View>

      <Text style={[styles.section, { color: tokens.color.text.muted }]}>{t('suggestions')}</Text>
      {SUGGESTIONS.map((user) => (
        <View key={user.id} style={styles.suggestionRow}>
          <Avatar name={user.name} muted />
          <View style={styles.profileText}>
            <Text style={[styles.name, { color: tokens.color.text.primary }]}>{user.name}</Text>
            <Text style={[styles.subtitle, { color: tokens.color.text.muted }]}>
              {user.subtitle}
            </Text>
          </View>
          <Pressable>
            <Text style={[styles.follow, { color: tokens.color.text.link }]}>{t('follow')}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { width: 300, paddingTop: 16, gap: 4 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 15, fontWeight: '800' },
  profileText: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 12.5 },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 14 },
  follow: { fontSize: 13, fontWeight: '700' },
});
