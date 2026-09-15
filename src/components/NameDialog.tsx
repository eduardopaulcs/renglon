import { useState, type ReactNode } from 'react';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';

import { t } from '@/i18n';

interface NameDialogProps {
  visible: boolean;
  title: string;
  placeholder: string;
  confirmLabel: string;
  initialValue?: string;
  error?: string | null;
  /** Starting value of an extra choice shown under the name, such as a folder icon or a tag color. */
  initialOption?: string | null;
  renderOption?: (value: string | null, onChange: (value: string | null) => void) => ReactNode;
  onDismiss: () => void;
  onSubmit: (name: string, option: string | null) => void;
}

export function NameDialog({ visible, title, onDismiss, ...form }: NameDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        {/* Remounting on every open starts from the current values instead of the last typed ones. */}
        {visible ? (
          <NameForm key={`${form.initialValue ?? ''}|${form.initialOption ?? ''}`} onDismiss={onDismiss} {...form} />
        ) : null}
      </Dialog>
    </Portal>
  );
}

function NameForm({
  placeholder,
  confirmLabel,
  initialValue = '',
  error,
  initialOption = null,
  renderOption,
  onDismiss,
  onSubmit,
}: Omit<NameDialogProps, 'visible' | 'title'>) {
  const [value, setValue] = useState(initialValue);
  const [option, setOption] = useState(initialOption);
  const trimmed = value.trim();

  const submit = () => {
    if (trimmed) onSubmit(trimmed, option);
  };

  return (
    <>
      <Dialog.Content>
        <TextInput
          mode="outlined"
          // With a choice below the name, the keyboard would open on top of it.
          autoFocus={!renderOption}
          value={value}
          placeholder={placeholder}
          onChangeText={setValue}
          onSubmitEditing={submit}
          returnKeyType="done"
          error={!!error}
        />
        {error ? <HelperText type="error">{error}</HelperText> : null}
        {renderOption?.(option, setOption)}
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
