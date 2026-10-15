import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ProfileMenuContent } from '@/features/profile/components/profile-menu-content';
import { useDeviceType } from '@/hooks/use-device-type';
import { usePresentableSheet } from '@/hooks/use-presentable-sheet';
import { useTokens } from '@/theme/theme-provider';

export interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
}

/** Profile options menu: bottom sheet on native/web-mobile, centered modal on web desktop. */
export function ProfileMenu({ visible, onClose }: ProfileMenuProps) {
  const tokens = useTokens();
  const { isWebDesktop } = useDeviceType();
  const { ref, onDismiss, onChange } = usePresentableSheet(visible, onClose);

  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: tokens.color.bg.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    }),
    [tokens.color.bg.surface],
  );

  if (isWebDesktop) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <View style={[styles.dim, { backgroundColor: tokens.color.bg.inverse }]} />
          </Pressable>
          <View
            style={[
              styles.card,
              { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
            ]}>
            <ProfileMenuContent onClose={onClose} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <BottomSheetModal
      ref={ref}
      enablePanDownToClose
      handleComponent={null}
      backdropComponent={backdrop}
      backgroundStyle={backgroundStyle}
      onChange={onChange}
      onDismiss={onDismiss}>
      <ProfileMenuContent onClose={onClose} />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
