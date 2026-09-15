import { useState, type ReactNode } from 'react';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';

import { t } from '@/i18n';

import { useValueWhileVisible } from './useValueWhileVisible';

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
  const shownTitle = useValueWhileVisible(title, visible);
  const error = useValueWhileVisible(form.error ?? null, visible);
  const initialValue = useValueWhileVisible(form.initialValue ?? '', visible);
  const initialOption = useValueWhileVisible(form.initialOption ?? null, visible);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{shownTitle}</Dialog.Title>
        {/*
          The form stays mounted while the dialog fades out, so its field and buttons do not vanish
          mid-animation. Paper unmounts the dialog content once it is hidden, so every open starts
          from the current values anyway; the key covers them changing while it is open.
        */}
        <NameForm
          key={`${initialValue}|${initialOption ?? ''}`}
          {...form}
          initialValue={initialValue}
          initialOption={initialOption}
          error={error}
          onDismiss={onDismiss}
        />
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
