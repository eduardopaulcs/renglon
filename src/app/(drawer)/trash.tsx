import { useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Button, Dialog, Portal, Text } from 'react-native-paper';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { NoteCard } from '@/components/NoteCard';
import { useSnackbar } from '@/components/SnackbarProvider';
import { useLiveData } from '@/db/live';
import { deleteNotesForever, emptyTrash, listNotes, restoreNotes, type NoteListItem } from '@/db/queries/notes';
import { formatDate, t, tp } from '@/i18n';
import { stripMarkdown } from '@/lib/markdown';
import { titleFont, useAppTheme } from '@/theme';

export default function TrashScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const showSnackbar = useSnackbar();
  const notes = useLiveData(() => listNotes({ trashed: true }), ['notes', 'note_tags', 'tags', 'folders'], []) ?? [];

  const [active, setActive] = useState<NoteListItem | null>(null);
  const [confirm, setConfirm] = useState<'empty' | 'note' | null>(null);

  const restore = (note: NoteListItem) => {
    setActive(null);
    restoreNotes([note.id]);
    showSnackbar(tp('trash.restored', 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} accessibilityLabel={t('nav.openMenu')} />
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
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState icon="trash-can-outline" title={t('trash.empty')} />}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            dateLabel={item.deletedAt ? t('trash.deletedOn', { date: formatDate(item.deletedAt) }) : undefined}
            onPress={setActive}
          />
        )}
      />

      <Portal>
        <Dialog visible={!!active && confirm === null} onDismiss={() => setActive(null)}>
          <Dialog.Title numberOfLines={1}>{active?.title || t('notes.untitled')}</Dialog.Title>
          {active?.body ? (
            <Dialog.Content>
              <Text variant="bodyMedium" numberOfLines={4}>
                {stripMarkdown(active.body)}
              </Text>
            </Dialog.Content>
          ) : null}
          <Dialog.Actions>
            <Button textColor={theme.colors.error} onPress={() => setConfirm('note')}>
              {t('trash.deleteForever')}
            </Button>
            <Button onPress={() => active && restore(active)}>{t('trash.restore')}</Button>
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
          setActive(null);
          showSnackbar(tp('trash.deleted', 1));
        }}
      />
      <ConfirmDialog
        visible={confirm === 'empty'}
        title={t('trash.emptyAction')}
        message={tp('trash.emptyConfirm', notes.length)}
        confirmLabel={t('trash.emptyAction')}
        onDismiss={() => setConfirm(null)}
        onConfirm={() => {
          const deleted = notes.length;
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
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },
  separator: { height: 10 },
});
