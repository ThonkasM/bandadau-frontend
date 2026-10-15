import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openAdminPanel } from '@/auth/handoff';
import { logout } from '@/auth/session';
import { hasPanelAccess, useSessionStore } from '@/stores/session.store';
import { useTokens } from '@/theme/theme-provider';

function Row({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const tokens = useTokens();
  const tint = danger ? tokens.color.feedback.danger.fg : tokens.color.text.primary;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: tokens.color.bg.muted }]}>
        <MaterialCommunityIcons name={icon} size={20} color={tint} />
      </View>
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={tokens.color.text.muted} />
    </Pressable>
  );
}

/** Profile "⋯" menu options (tickets, edit, settings, open panel, log out). */
export function ProfileMenuContent({ onClose }: { onClose: () => void }) {
  const tokens = useTokens();
  const { t } = useTranslation(['profile', 'app']);
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  const go = (href: string) => () => {
    onClose();
    router.push(href as never);
  };

  const onLogout = async () => {
    onClose();
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: tokens.color.text.muted }]}>
          {t('profile:menu.header')}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('app:close')}
          hitSlop={8}
          style={[styles.closeButton, { backgroundColor: tokens.color.bg.muted }]}>
          <MaterialCommunityIcons name="close" size={16} color={tokens.color.text.secondary} />
        </Pressable>
      </View>

      <Row icon="ticket-outline" label={t('profile:menu.tickets')} onPress={go('/tickets')} />
      <Row icon="account-edit-outline" label={t('profile:menu.edit')} onPress={go('/profile/edit')} />
      <Row icon="cog-outline" label={t('profile:menu.settings')} onPress={go('/settings')} />
      {hasPanelAccess(user?.roles) ? (
        <Row
          icon="shield-account-outline"
          label={t('profile:menu.openPanel')}
          onPress={() => {
            onClose();
            void openAdminPanel();
          }}
        />
      ) : null}
      <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
      <Row icon="logout" label={t('profile:menu.logout')} danger onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 6 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginVertical: 6 },
});
