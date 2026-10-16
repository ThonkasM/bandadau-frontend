import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { type ReportReason, type ReportTargetType, useReportContent } from '@/features/social/api';
import { useTokens } from '@/theme/theme-provider';

const REASONS: ReportReason[] = [
  'SPAM',
  'HARASSMENT',
  'NSFW',
  'VIOLENCE',
  'MISINFORMATION',
  'OTHER',
];

/** UC-10 · Report content: pick a reason and submit (♻️). */
export function ReportSheet({
  visible,
  targetType,
  targetId,
  onClose,
}: {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}) {
  const tokens = useTokens();
  const { t } = useTranslation('feed');
  const report = useReportContent();
  const [done, setDone] = useState(false);

  const close = () => {
    setDone(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.color.bg.inverse, opacity: 0.5 }]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel={t('report.cancel')}
        />
        <Pressable
          onPress={() => undefined}
          style={[
            styles.card,
            { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
          ]}>
          <Text style={[styles.title, { color: tokens.color.text.primary }]}>
            {t('report.title')}
          </Text>

          {done ? (
            <View style={styles.doneRow}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={tokens.color.feedback.success.fg}
              />
              <Text style={{ color: tokens.color.feedback.success.fg }}>{t('report.done')}</Text>
            </View>
          ) : (
            REASONS.map((reason) => (
              <Pressable
                key={reason}
                onPress={() =>
                  report.mutate({ targetType, targetId, reason }, { onSuccess: () => setDone(true) })
                }
                disabled={report.isPending}
                accessibilityRole="button"
                style={styles.row}>
                <MaterialCommunityIcons name="flag-outline" size={18} color={tokens.color.text.muted} />
                <Text style={[styles.label, { color: tokens.color.text.primary }]}>
                  {t(`report.reason.${reason}`)}
                </Text>
              </Pressable>
            ))
          )}

          <Pressable onPress={close} accessibilityRole="button" style={styles.row}>
            <Text style={{ color: tokens.color.text.link }}>{t('report.cancel')}</Text>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 4 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  label: { fontSize: 15 },
});
