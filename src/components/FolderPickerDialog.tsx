import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, List, Portal, RadioButton, TextInput } from 'react-native-paper';

import { useLiveData } from '@/db/live';
import { createFolder, listFolders } from '@/db/queries/folders';
import { t } from '@/i18n';

interface FolderPickerDialogProps {
  visible: boolean;
  selectedId: number | null;
  onSelect: (folderId: number | null) => void;
  onDismiss: () => void;
}

const NO_FOLDER = 'none';

export function FolderPickerDialog({ visible, selectedId, onSelect, onDismiss }: FolderPickerDialogProps) {
  const folders = useLiveData(listFolders, ['folders'], []) ?? [];
  const [name, setName] = useState('');
  const trimmed = name.trim();

  const pick = (folderId: number | null) => {
    onSelect(folderId);
    setName('');
    onDismiss();
  };

  const create = () => {
    if (trimmed) pick(createFolder(trimmed).id);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{t('folders.pick')}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <RadioButton.Group
              value={selectedId === null ? NO_FOLDER : String(selectedId)}
              onValueChange={(value) => pick(value === NO_FOLDER ? null : Number(value))}>
              <RadioButton.Item label={t('editor.noFolder')} value={NO_FOLDER} />
              {folders.map((folder) => (
                <RadioButton.Item key={folder.id} label={folder.name} value={String(folder.id)} />
              ))}
            </RadioButton.Group>
            <List.Section style={styles.create}>
              <TextInput
                mode="outlined"
                dense
                value={name}
                placeholder={t('folders.new')}
                onChangeText={setName}
                onSubmitEditing={create}
                left={<TextInput.Icon icon="folder-plus-outline" />}
                right={trimmed ? <TextInput.Icon icon="check" onPress={create} /> : undefined}
              />
            </List.Section>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.close')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scrollArea: { maxHeight: 380, paddingHorizontal: 0 },
  create: { paddingHorizontal: 24 },
});
