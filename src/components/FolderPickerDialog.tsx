import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, List, Portal, RadioButton, TextInput } from 'react-native-paper';

import { useLiveData } from '@/db/live';
import { createFolder, listFolders } from '@/db/queries/folders';
import { t } from '@/i18n';
import { folderIcon } from '@/lib/appearance';

interface FolderPickerDialogProps {
  visible: boolean;
  /** `undefined` when several notes with different folders are being moved: nothing is checked. */
  selectedId: number | null | undefined;
  onSelect: (folderId: number | null) => void;
  onDismiss: () => void;
}

/** A single-choice row with the folder's icon, shared by every dialog that lists folders. */
export function FolderOptionRow({
  icon,
  label,
  checked,
  onPress,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <List.Item
      title={label}
      titleNumberOfLines={1}
      onPress={onPress}
      left={(props) => <List.Icon {...props} icon={icon} />}
      right={() => <RadioButton.Android value={label} status={checked ? 'checked' : 'unchecked'} onPress={onPress} />}
    />
  );
}

/**
 * Same layout as `TagPickerDialog`: type to filter, and a "Create folder" row appears when the
 * name does not exist yet. Picking a folder, or creating one, applies it and closes the dialog,
 * since a note lives in a single folder.
 */
export function FolderPickerDialog({ visible, selectedId, onSelect, onDismiss }: FolderPickerDialogProps) {
  const folders = useLiveData(listFolders, ['folders'], []) ?? [];
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const visibleFolders = lower ? folders.filter((folder) => folder.name.toLowerCase().includes(lower)) : folders;
  const exactMatch = folders.find((folder) => folder.name.toLowerCase() === lower);

  const close = () => {
    setQuery('');
    onDismiss();
  };

  const pick = (folderId: number | null) => {
    onSelect(folderId);
    close();
  };

  const submit = () => {
    if (!trimmed) return;
    pick(exactMatch ? exactMatch.id : createFolder(trimmed).id);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={close}>
        <Dialog.Title>{t('folders.pick')}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            dense
            value={query}
            placeholder={t('folders.searchOrCreate')}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            left={<TextInput.Icon icon="folder-outline" />}
          />
        </Dialog.Content>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {trimmed && !exactMatch ? (
              <List.Item
                title={t('folders.createInline', { name: trimmed })}
                left={(props) => <List.Icon {...props} icon="plus" />}
                onPress={submit}
              />
            ) : null}
            {trimmed ? null : (
              <FolderOptionRow
                icon="folder-off-outline"
                label={t('editor.noFolder')}
                checked={selectedId === null}
                onPress={() => pick(null)}
              />
            )}
            {visibleFolders.map((folder) => (
              <FolderOptionRow
                key={folder.id}
                icon={folderIcon(folder.icon)}
                label={folder.name}
                checked={selectedId === folder.id}
                onPress={() => pick(folder.id)}
              />
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={close}>{t('common.close')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scrollArea: { maxHeight: 320, paddingHorizontal: 0 },
});
