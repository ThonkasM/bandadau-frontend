import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Group } from '@/features/groups/types';
import { useTokens } from '@/theme/theme-provider';

export function GroupCard({
  group,
  onJoin,
}: {
  group: Group;
  onJoin?: () => void;
}) {
  const tokens = useTokens();
  const { t } = useTranslation('groups');
  const member = group.myMembership?.status === 'ACTIVE';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
      ]}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: tokens.color.text.primary }]}>{group.name}</Text>
        <Text style={[styles.meta, { color: tokens.color.text.muted }]}>{group.subject}</Text>
        <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
          {t(`privacy.${group.privacy}`)}
        </Text>
        <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
          {t('members', { count: group.membersCount })}
        </Text>
      </View>
      {member ? (
        <Text style={{ color: tokens.color.feedback.success.fg }}>{t('joined')}</Text>
      ) : (
        <Pressable
          onPress={onJoin}
          style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
          <Text style={{ color: tokens.color.action.primary.fg }}>{t('join')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  body: { flex: 1, gap: 3 },
  title: { fontSize: 15.5, fontWeight: '800' },
  meta: { fontSize: 13 },
  button: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
});
