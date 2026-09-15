import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, List, Portal, RadioButton, TextInput } from 'react-native-paper';

import { useLiveData } from '@/db/live';
import { createFolder, listFolders } from '@/db/queries/folders';
import type { Folder } from '@/db/schema';
import { t } from '@/i18n';
import { folderIcon } from '@/lib/appearance';

import { useValueWhileVisible } from './useValueWhileVisible';

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
      right={() => (
        <RadioButton.Android value={label} status={checked ? 'checked' : 'unchecked'} onPress={onPress} />
      )}
    />
  );
}

/**
 * Same layout as `TagPickerDialog`: type to filter, and a "Create folder" row appears when the
 * name does not exist yet. Picking a folder, or creating one, applies it and closes the dialog,
 * since a note lives in a single folder.
 */
export function FolderPickerDialog({ visible, selectedId, onSelect, onDismiss }: FolderPickerDialogProps) {
  // Loaded out here, where it survives between opens, so the list is never empty for a frame.
  const folders = useLiveData(listFolders, ['folders'], []) ?? [];
  // A bulk move clears the selection as soon as a folder is picked.
  const shownSelectedId = useValueWhileVisible(selectedId, visible);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <FolderPickerContent
          folders={folders}
          selectedId={shownSelectedId}
          onSelect={onSelect}
          onDismiss={onDismiss}
        />
      </Dialog>
    </Portal>
  );
}

/**
 * Holds the search text. It lives inside the dialog, which unmounts it once it has faded out, so
 * every open starts with an empty search without clearing it on close, when the list would
 * visibly jump back to its full length.
 */
function FolderPickerContent({
  folders,
  selectedId,
  onSelect,
  onDismiss,
}: Omit<FolderPickerDialogProps, 'visible'> & { folders: Folder[] }) {
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const visibleFolders = lower
    ? folders.filter((folder) => folder.name.toLowerCase().includes(lower))
    : folders;
  const exactMatch = folders.find((folder) => folder.name.toLowerCase() === lower);

  const pick = (folderId: number | null) => {
    onSelect(folderId);
    onDismiss();
  };

  const submit = () => {
    if (!trimmed) return;
    pick(exactMatch ? exactMatch.id : createFolder(trimmed).id);
  };

  return (
    <>
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
        <Button onPress={onDismiss}>{t('common.close')}</Button>
      </Dialog.Actions>
    </>
  );
}

const styles = StyleSheet.create({
  scrollArea: { maxHeight: 320, paddingHorizontal: 0 },
});
