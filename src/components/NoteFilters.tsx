import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Icon, Portal } from 'react-native-paper';

import type { Folder, Tag } from '@/db/schema';
import { t } from '@/i18n';
import { folderIcon } from '@/lib/appearance';
import { tagColors, useAppTheme } from '@/theme';

import { FolderOptionRow } from './FolderPickerDialog';

/** `undefined` shows every folder; `null` shows only the notes that are in no folder. */
export type FolderFilter = number | null | undefined;

interface NoteFiltersProps {
  folders: Folder[];
  tags: Tag[];
  /** False inside a folder screen, which already is a folder filter. */
  showFolder: boolean;
  folderValue: FolderFilter;
  onFolderChange: (value: FolderFilter) => void;
  tagIds: number[];
  onTagIdsChange: (ids: number[]) => void;
}

/**
 * A scrollable row of chips above the note list: one to pick the folder to show, then one per
 * tag. Selected tags combine, so each one narrows the list further.
 */
export function NoteFilters({
  folders,
  tags,
  showFolder,
  folderValue,
  onFolderChange,
  tagIds,
  onTagIdsChange,
}: NoteFiltersProps) {
  const theme = useAppTheme();
  const [choosingFolder, setChoosingFolder] = useState(false);

  const folderChip = showFolder && folders.length > 0;
  if (!folderChip && tags.length === 0) return null;

  const active = folderValue !== undefined || tagIds.length > 0;
  const folder = typeof folderValue === 'number' ? folders.find((item) => item.id === folderValue) : undefined;
  const folderLabel =
    folderValue === undefined ? t('filter.allFolders') : (folder?.name ?? t('editor.noFolder'));
  const folderChipIcon =
    folderValue === undefined ? 'folder-multiple-outline' : folder ? folderIcon(folder.icon) : 'folder-off-outline';

  const toggleTag = (id: number) =>
    onTagIdsChange(tagIds.includes(id) ? tagIds.filter((value) => value !== id) : [...tagIds, id]);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        contentContainerStyle={styles.row}>
        {active ? (
          <Chip
            compact
            icon="filter-remove-outline"
            onPress={() => {
              onFolderChange(undefined);
              onTagIdsChange([]);
            }}>
            {t('filter.clear')}
          </Chip>
        ) : null}

        {folderChip ? (
          <Chip
            compact
            mode={folderValue === undefined ? 'outlined' : 'flat'}
            icon={folderChipIcon}
            closeIcon="menu-down"
            onPress={() => setChoosingFolder(true)}
            onClose={() => setChoosingFolder(true)}
            closeIconAccessibilityLabel={t('filter.title')}
            style={styles.folderChip}>
            {folderLabel}
          </Chip>
        ) : null}

        {tags.map((tag) => {
          const selected = tagIds.includes(tag.id);
          const colors = tagColors(theme, tag.color);
          return (
            <Chip
              key={tag.id}
              compact
              mode={selected ? 'flat' : 'outlined'}
              selected={selected}
              showSelectedCheck={false}
              icon={({ size }) => (
                <View style={[styles.chipIcon, { width: size, height: size }]}>
                  <Icon
                    source={selected ? 'check' : 'circle'}
                    size={selected ? size : 10}
                    color={selected ? colors.onContainer : colors.dot}
                  />
                </View>
              )}
              onPress={() => toggleTag(tag.id)}
              style={selected ? { backgroundColor: colors.container } : undefined}
              textStyle={selected ? { color: colors.onContainer } : undefined}>
              #{tag.name}
            </Chip>
          );
        })}
      </ScrollView>

      <Portal>
        <Dialog visible={choosingFolder} onDismiss={() => setChoosingFolder(false)}>
          <Dialog.Title>{t('filter.title')}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView>
              {[
                { key: 'all', icon: 'folder-multiple-outline', label: t('filter.allFolders'), value: undefined },
                { key: 'none', icon: 'folder-off-outline', label: t('editor.noFolder'), value: null },
                ...folders.map((item) => ({
                  key: String(item.id),
                  icon: folderIcon(item.icon),
                  label: item.name,
                  value: item.id,
                })),
              ].map((option) => (
                <FolderOptionRow
                  key={option.key}
                  icon={option.icon}
                  label={option.label}
                  checked={option.value === folderValue}
                  onPress={() => {
                    onFolderChange(option.value);
                    setChoosingFolder(false);
                  }}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setChoosingFolder(false)}>{t('common.close')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  // A horizontal ScrollView grows to fill its parent's height unless told otherwise.
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, alignItems: 'center' },
  folderChip: { maxWidth: 220 },
  chipIcon: { alignItems: 'center', justifyContent: 'center' },
  dialogScroll: { maxHeight: 360, paddingHorizontal: 0 },
});
