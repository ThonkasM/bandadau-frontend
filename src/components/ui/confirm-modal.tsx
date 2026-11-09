import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, useTokens } from '@/theme/theme-provider';

/**
 * «¿Estás seguro?» confirmation, same visual language as `PaymentModal` (scrim, centered card, primary
 * action + text link). Closing it (back button, scrim tap, cancel) never runs the action.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  icon = 'help-circle-outline',
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const tokens = useTokens();
  const { effective } = useTheme();
  const scrim = effective === 'dark' ? tokens.color.bg.canvas : tokens.color.bg.inverse;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, { backgroundColor: scrim, opacity: 0.5 }]}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
          ]}>
          <MaterialCommunityIcons name={icon} size={56} color={tokens.color.action.primary.bg} />
          <Text style={[styles.title, { color: tokens.color.text.primary }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: tokens.color.text.muted }]}>{message}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={[styles.button, { backgroundColor: tokens.color.action.primary.bg }]}>
            <Text style={[styles.buttonLabel, { color: tokens.color.action.primary.fg }]}>
              {confirmLabel}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.linkBtn}>
            <Text style={[styles.link, { color: tokens.color.text.muted }]}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center' },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
  linkBtn: { paddingVertical: 4 },
  link: { fontSize: 14 },
});
