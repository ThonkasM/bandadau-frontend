import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { TextField, type TextFieldProps } from '@/components/ui/text-field';
import { useTokens } from '@/theme/theme-provider';

/** Password input with a show/hide toggle. */
export function PasswordField(props: TextFieldProps) {
  const tokens = useTokens();
  const { t } = useTranslation('auth');
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      secureTextEntry={!visible}
      rightAccessory={
        <Pressable
          onPress={() => setVisible((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={visible ? t('hidePassword') : t('showPassword')}
          hitSlop={8}>
          <MaterialCommunityIcons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={tokens.color.text.muted}
          />
        </Pressable>
      }
    />
  );
}
