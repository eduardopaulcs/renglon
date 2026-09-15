import { useState } from 'react';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';

import { t } from '@/i18n';

interface NameDialogProps {
  visible: boolean;
  title: string;
  placeholder: string;
  confirmLabel: string;
  initialValue?: string;
  error?: string | null;
  onDismiss: () => void;
  onSubmit: (name: string) => void;
}

export function NameDialog({ visible, title, onDismiss, ...form }: NameDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        {/* Remounting on every open starts from the current name instead of the last typed value. */}
        {visible ? <NameForm key={form.initialValue ?? ''} onDismiss={onDismiss} {...form} /> : null}
      </Dialog>
    </Portal>
  );
}

function NameForm({
  placeholder,
  confirmLabel,
  initialValue = '',
  error,
  onDismiss,
  onSubmit,
}: Omit<NameDialogProps, 'visible' | 'title'>) {
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();

  const submit = () => {
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <>
      <Dialog.Content>
        <TextInput
          mode="outlined"
          autoFocus
          value={value}
          placeholder={placeholder}
          onChangeText={setValue}
          onSubmitEditing={submit}
          returnKeyType="done"
          error={!!error}
        />
        {error ? <HelperText type="error">{error}</HelperText> : null}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>{t('common.cancel')}</Button>
        <Button onPress={submit} disabled={!trimmed}>
          {confirmLabel}
        </Button>
      </Dialog.Actions>
    </>
  );
}
