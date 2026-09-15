import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Checkbox, Dialog, List, Portal, Text, TextInput } from 'react-native-paper';

import { useLiveData } from '@/db/live';
import { createTag, listTags } from '@/db/queries/tags';
import { t } from '@/i18n';

interface TagPickerDialogProps {
  visible: boolean;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onDismiss: () => void;
}

/** Changes apply immediately, like toggling a checkbox anywhere else in Android. */
export function TagPickerDialog({ visible, selectedIds, onChange, onDismiss }: TagPickerDialogProps) {
  const allTags = useLiveData(listTags, ['tags'], []) ?? [];
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const visibleTags = lower ? allTags.filter((tag) => tag.name.toLowerCase().includes(lower)) : allTags;
  const exactMatch = allTags.some((tag) => tag.name.toLowerCase() === lower);

  const toggle = (id: number) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);

  const create = () => {
    const tag = createTag(trimmed);
    if (!selectedIds.includes(tag.id)) onChange([...selectedIds, tag.id]);
    setQuery('');
  };

  const close = () => {
    setQuery('');
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={close}>
        <Dialog.Title>{t('tags.pick')}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            dense
            value={query}
            placeholder={t('tags.namePlaceholder')}
            onChangeText={setQuery}
            onSubmitEditing={() => trimmed && !exactMatch && create()}
            left={<TextInput.Icon icon="tag-outline" />}
          />
        </Dialog.Content>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {trimmed && !exactMatch ? (
              <List.Item
                title={t('tags.createInline', { name: trimmed })}
                left={(props) => <List.Icon {...props} icon="plus" />}
                onPress={create}
              />
            ) : null}
            {visibleTags.map((tag) => (
              <Checkbox.Item
                key={tag.id}
                label={tag.name}
                status={selectedIds.includes(tag.id) ? 'checked' : 'unchecked'}
                onPress={() => toggle(tag.id)}
              />
            ))}
            {allTags.length === 0 && !trimmed ? (
              <Text variant="bodyMedium" style={styles.empty}>
                {t('tags.none')}
              </Text>
            ) : null}
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
  empty: { paddingHorizontal: 24, paddingVertical: 16, opacity: 0.7 },
});
