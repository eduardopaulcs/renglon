import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Checkbox, Dialog, List, Portal, Text, TextInput } from 'react-native-paper';

import { useLiveData } from '@/db/live';
import { addTagToNotes, countTagsOnNotes, removeTagFromNotes } from '@/db/queries/notes';
import { createTag, listTags } from '@/db/queries/tags';
import { t } from '@/i18n';
import { tagColors, useAppTheme } from '@/theme';

interface TagPickerDialogProps {
  visible: boolean;
  /** One note from the editor, or every selected note from a list. */
  noteIds: number[];
  onDismiss: () => void;
}

/**
 * Same layout as `FolderPickerDialog`: type to filter, and a "Create tag" row appears when the
 * name does not exist yet. A note can have many tags, so the dialog stays open and changes apply
 * immediately, like toggling a checkbox anywhere else in Android.
 *
 * With several notes, a tag only some of them have shows as indeterminate, and tapping it adds
 * the tag to all of them.
 */
export function TagPickerDialog({ visible, noteIds, onDismiss }: TagPickerDialogProps) {
  const theme = useAppTheme();
  const allTags = useLiveData(listTags, ['tags'], []) ?? [];
  // Keyed by the ids' contents: callers pass a fresh array on every render.
  const counts = useLiveData(() => countTagsOnNotes(noteIds), ['note_tags'], [noteIds.join(',')]);
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const visibleTags = lower ? allTags.filter((tag) => tag.name.toLowerCase().includes(lower)) : allTags;
  const exactMatch = allTags.find((tag) => tag.name.toLowerCase() === lower);

  const statusOf = (tagId: number) => {
    const tagged = counts?.get(tagId) ?? 0;
    if (tagged === 0) return 'unchecked';
    return tagged >= noteIds.length ? 'checked' : 'indeterminate';
  };

  const toggle = (tagId: number) => {
    if (statusOf(tagId) === 'checked') removeTagFromNotes(noteIds, tagId);
    else addTagToNotes(noteIds, tagId);
  };

  const submit = () => {
    if (!trimmed) return;
    addTagToNotes(noteIds, (exactMatch ?? createTag(trimmed)).id);
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
            placeholder={t('tags.searchOrCreate')}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            left={<TextInput.Icon icon="tag-outline" />}
          />
        </Dialog.Content>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {trimmed && !exactMatch ? (
              <List.Item
                title={t('tags.createInline', { name: trimmed })}
                left={(props) => <List.Icon {...props} icon="plus" />}
                onPress={submit}
              />
            ) : null}
            {visibleTags.map((tag) => (
              <List.Item
                key={tag.id}
                title={tag.name}
                titleNumberOfLines={1}
                onPress={() => toggle(tag.id)}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={tag.color ? 'tag' : 'tag-outline'}
                    color={tag.color ? tagColors(theme, tag.color).dot : props.color}
                  />
                )}
                right={() => <Checkbox.Android status={statusOf(tag.id)} onPress={() => toggle(tag.id)} />}
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
