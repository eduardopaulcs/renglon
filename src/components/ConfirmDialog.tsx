import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { t } from '@/i18n';
import { useAppTheme } from '@/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Used only for actions that cannot be undone, so the confirm button is always destructive. */
export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onDismiss }: ConfirmDialogProps) {
  const theme = useAppTheme();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button onPress={onConfirm} textColor={theme.colors.error}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
