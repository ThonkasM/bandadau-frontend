export interface TextEditorSheetProps {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
}

/**
 * UC-17 · Study-text editor. Platform split (Metro picks `.native`/`.web`):
 * - native → `@gorhom/bottom-sheet` with `BottomSheetTextInput` (keyboard-aware).
 * - web → centered `Modal` with a plain `TextInput`, because gorhom's `BottomSheetTextInput`
 *   calls `TextInput.State.currentlyFocusedInput`, which react-native-web does not implement
 *   (`RNTextInput.default.State.currentlyFocusedInput is not a function`).
 *
 * This base file only provides the shared type + a no-op default for TypeScript.
 */
export default function TextEditorSheet(_props: TextEditorSheetProps) {
  return null;
}
