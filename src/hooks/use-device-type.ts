import { Platform, useWindowDimensions } from 'react-native';

const WEB_DESKTOP_MIN_WIDTH = 900;

export interface DeviceType {
  width: number;
  isWeb: boolean;
  /** Web at a phone/tablet width: touch-first (no arrows, sheet-style modals). */
  isWebMobile: boolean;
  /** Web at desktop width: pointer-first (arrows, two-pane modals, right rail). */
  isWebDesktop: boolean;
  isNative: boolean;
}

/** Single source of truth for platform/width branching (web mobile vs desktop vs native). */
export function useDeviceType(): DeviceType {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWebDesktop = isWeb && width >= WEB_DESKTOP_MIN_WIDTH;
  return {
    width,
    isWeb,
    isWebMobile: isWeb && !isWebDesktop,
    isWebDesktop,
    isNative: !isWeb,
  };
}
