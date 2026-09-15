import { useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Button, Dialog, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { NoteCard } from '@/components/NoteCard';
import { useSnackbar } from '@/components/SnackbarProvider';
import { useLiveData } from '@/db/live';
import {
  NOTE_PAGE_SIZE,
  countTrashed,
  deleteNotesForever,
  emptyTrash,
  listNotes,
  restoreNotes,
  type NoteListItem,
} from '@/db/queries/notes';
import { formatDate, t, tp } from '@/i18n';
import { notePreview } from '@/lib/markdown';
import { titleFont, useAppTheme } from '@/theme';

export default function TrashScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const showSnackbar = useSnackbar();
  const insets = useSafeAreaInsets();
  const [limit, setLimit] = useState(NOTE_PAGE_SIZE);
  const page = useLiveData(
    () => listNotes({ trashed: true }, limit),
    ['notes', 'note_tags', 'tags', 'folders'],
    [limit]
  );
  const notes = page?.items ?? [];
  // Counted separately because the list may only hold the first page.
  const trashedCount = useLiveData(countTrashed, ['notes'], []) ?? 0;

  // Whether the dialog is open is kept apart from which note it shows: clearing the note on close
  // would swap its title for "Untitled" while the dialog is still fading out.
  const [active, setActive] = useState<NoteListItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState<'empty' | 'note' | null>(null);

  const open = (note: NoteListItem) => {
    setActive(note);
    setDialogOpen(true);
  };

  const close = () => setDialogOpen(false);

  const restore = () => {
    if (!active) return;
    close();
    restoreNotes([active.id]);
    showSnackbar(tp('trash.restored', 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.openDrawer()}
          accessibilityLabel={t('nav.openMenu')}
        />
        <Appbar.Content title={t('nav.trash')} titleStyle={[styles.title, { color: theme.colors.primary }]} />
        {notes.length ? (
          <Appbar.Action
            icon="delete-sweep-outline"
            onPress={() => setConfirm('empty')}
            accessibilityLabel={t('trash.emptyAction')}
          />
        ) : null}
      </Appbar.Header>

      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        contentContainerStyle={[styles.list, { paddingBottom: 48 + insets.bottom }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={() => {
          if (page?.hasMore) setLimit(limit + NOTE_PAGE_SIZE);
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<EmptyState icon="trash-can-outline" title={t('trash.empty')} />}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            dateLabel={
              item.deletedAt ? t('trash.deletedOn', { date: formatDate(item.deletedAt) }) : undefined
            }
            onPress={open}
          />
        )}
      />

      <Portal>
        <Dialog visible={dialogOpen && confirm === null} onDismiss={close}>
          <Dialog.Title numberOfLines={1}>{active?.title || t('notes.untitled')}</Dialog.Title>
          {active?.body ? (
            <Dialog.Content>
              <Text variant="bodyMedium" numberOfLines={4}>
                {notePreview(active.body)}
              </Text>
            </Dialog.Content>
          ) : null}
          <Dialog.Actions style={styles.actions}>
            <Button onPress={close}>{t('common.cancel')}</Button>
            <Button textColor={theme.colors.error} onPress={() => setConfirm('note')}>
              {t('trash.deleteForever')}
            </Button>
            <Button onPress={restore}>{t('trash.restore')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfirmDialog
        visible={confirm === 'note'}
        title={t('trash.deleteForever')}
        message={t('trash.deleteForeverConfirm')}
        confirmLabel={t('trash.deleteForever')}
        onDismiss={() => setConfirm(null)}
        onConfirm={() => {
          if (active) deleteNotesForever([active.id]);
          setConfirm(null);
          close();
          showSnackbar(tp('trash.deleted', 1));
        }}
      />
      <ConfirmDialog
        visible={confirm === 'empty'}
        title={t('trash.emptyAction')}
        message={tp('trash.emptyConfirm', trashedCount)}
        confirmLabel={t('trash.emptyAction')}
        onDismiss={() => setConfirm(null)}
        onConfirm={() => {
          const deleted = trashedCount;
          emptyTrash();
          setConfirm(null);
          showSnackbar(tp('trash.deleted', deleted));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontFamily: titleFont, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  separator: { height: 10 },
  // Three actions do not fit on one row on narrow phones.
  actions: { flexWrap: 'wrap' },
});
