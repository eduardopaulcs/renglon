import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { t } from '@/i18n';
import { useAppTheme } from '@/theme';

import { useValueWhileVisible } from './useValueWhileVisible';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Used only for actions that cannot be undone, so the confirm button is always destructive. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onDismiss,
}: ConfirmDialogProps) {
  const theme = useAppTheme();
  // Confirming usually changes what the text describes: the folder no longer exists, the trash
  // holds 0 notes. The dialog keeps what it said while it fades out.
  const shownTitle = useValueWhileVisible(title, visible);
  const shownMessage = useValueWhileVisible(message, visible);
  const shownConfirmLabel = useValueWhileVisible(confirmLabel, visible);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{shownTitle}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{shownMessage}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button onPress={onConfirm} textColor={theme.colors.error}>
            {shownConfirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
