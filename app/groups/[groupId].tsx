import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VirtualList } from '@/components/ui/virtual-list';
import { PostCard } from '@/features/feed/components/post-card';
import type { FeedItem } from '@/features/feed/types';
import {
  useGroup,
  useGroupMembers,
  useGroupPosts,
  useJoinGroup,
  useLeaveGroup,
} from '@/features/groups/api';
import { useTokens } from '@/theme/theme-provider';

/** UC-09 · Group detail: info, membership, members and group posts. */
export default function GroupDetailScreen() {
  const tokens = useTokens();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation('groups');
  const group = useGroup(groupId);
  const members = useGroupMembers(groupId);
  const posts = useGroupPosts(groupId);
  const join = useJoinGroup();
  const leave = useLeaveGroup();

  if (group.isLoading) {
    return (
      <Screen title={t('title')} showBack>
        <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.center} />
      </Screen>
    );
  }

  if (!group.data) {
    return (
      <Screen title={t('title')} showBack>
        <Text style={{ color: tokens.color.text.muted }}>{t('error')}</Text>
      </Screen>
    );
  }

  const data = group.data;
  const active = data.myMembership?.status === 'ACTIVE';

  const header = (
    <View style={styles.header}>
      <Text style={[styles.subject, { color: tokens.color.text.primary }]}>{data.subject}</Text>
      <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
        {t(`privacy.${data.privacy}`)}
      </Text>
      <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
        {t('members', { count: data.membersCount })}
      </Text>

      {active ? (
        <Button
          label={t('leave')}
          variant="secondary"
          loading={leave.isPending}
          onPress={() => leave.mutate(groupId)}
        />
      ) : (
        <Button label={t('join')} loading={join.isPending} onPress={() => join.mutate(groupId)} />
      )}

      {members.items.length > 0 ? (
        <View style={styles.members}>
          <Text variant="label">{t('membersLabel')}</Text>
          {members.items.slice(0, 12).map((member) => (
            <Text key={member.userId} style={[styles.member, { color: tokens.color.text.secondary }]}>
              {member.profile?.displayName ?? ''}
            </Text>
          ))}
        </View>
      ) : null}

      <Text variant="label">{t('postsLabel')}</Text>
    </View>
  );

  return (
    <Screen title={data.name} showBack>
      <VirtualList<FeedItem>
        style={styles.list}
        data={posts.items}
        ListHeaderComponent={header}
        renderItem={({ item }) => <PostCard item={item} />}
        keyExtractor={(item) => item.post.id}
        hasMore={posts.hasMore}
        loadingMore={posts.loadingMore}
        refreshing={posts.refreshing}
        onEndReached={posts.loadMore}
        onRefresh={posts.refresh}
        renderEmpty={() => (
          <Text style={[styles.empty, { color: tokens.color.text.muted }]}>{t('postsEmpty')}</Text>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 24 },
  list: { flex: 1 },
  header: { gap: 8, marginBottom: 12 },
  subject: { fontSize: 18, fontWeight: '800' },
  meta: { fontSize: 13 },
  members: { gap: 2, marginTop: 4 },
  member: { fontSize: 14 },
  empty: { fontSize: 15, marginTop: 16 },
});
