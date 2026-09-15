import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { useCallback, useState } from 'react';
import { BackHandler, FlatList, StyleSheet, View } from 'react-native';
import { Appbar, FAB, Menu, Searchbar } from 'react-native-paper';

import { useLiveData } from '@/db/live';
import {
  createNote,
  listNotes,
  restoreNotes,
  searchNoteIds,
  trashNotes,
  type NoteListItem,
} from '@/db/queries/notes';
import { t, tp } from '@/i18n';
import { titleFont, useAppTheme } from '@/theme';

import { EmptyState } from './EmptyState';
import { NoteCard } from './NoteCard';
import { useSnackbar } from './SnackbarProvider';
import { SwipeToTrash } from './SwipeToTrash';

export interface ScreenMenuItem {
  label: string;
  onPress: () => void;
}

interface NotesScreenProps {
  title: string;
  folderId?: number;
  tagId?: number;
  emptyText: string;
  menu?: ScreenMenuItem[];
}

type DrawerNavigation = DrawerNavigationProp<Record<string, object | undefined>>;

/**
 * The note list shared by "All notes", a folder and a tag. Notes created from a folder or tag
 * screen start inside that folder or with that tag, so they do not vanish from the list the
 * user was looking at.
 */
export function NotesScreen({ title, folderId, tagId, emptyText, menu }: NotesScreenProps) {
  const theme = useAppTheme();
  const navigation = useNavigation<DrawerNavigation>();
  const showSnackbar = useSnackbar();

  const [searching, setSearching] = useState(false);
  const [term, setTerm] = useState('');
  const [selection, setSelection] = useState<ReadonlySet<number>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  const notes =
    useLiveData(
      () => listNotes({ folderId, tagId, ids: term.trim() ? searchNoteIds(term) : undefined }),
      ['notes', 'note_tags', 'tags', 'folders'],
      [folderId, tagId, term]
    ) ?? [];

  const selecting = selection.size > 0;

  const clearSearch = () => {
    setSearching(false);
    setTerm('');
  };

  // Hardware back leaves selection or search mode before it leaves the screen.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (selecting) {
          setSelection(new Set());
          return true;
        }
        if (searching) {
          clearSearch();
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [selecting, searching])
  );

  const trash = (ids: number[]) => {
    trashNotes(ids);
    setSelection(new Set());
    showSnackbar(tp('notes.trashed', ids.length), { label: t('common.undo'), onPress: () => restoreNotes(ids) });
  };

  const toggle = (id: number) =>
    setSelection((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const open = (note: NoteListItem) => {
    if (selecting) toggle(note.id);
    else router.push({ pathname: '/note/[id]', params: { id: String(note.id) } });
  };

  const startSelection = (note: NoteListItem) => {
    void Haptics.selectionAsync();
    toggle(note.id);
  };

  const create = () => {
    const note = createNote({ folderId, tagIds: tagId === undefined ? undefined : [tagId] });
    router.push({ pathname: '/note/[id]', params: { id: String(note.id) } });
  };

  const header = selecting ? (
    <Appbar.Header style={{ backgroundColor: theme.colors.primaryContainer }}>
      <Appbar.Action icon="close" onPress={() => setSelection(new Set())} accessibilityLabel={t('notes.clearSelection')} />
      <Appbar.Content title={tp('notes.selected', selection.size)} />
      <Appbar.Action
        icon="trash-can-outline"
        onPress={() => trash([...selection])}
        accessibilityLabel={t('notes.deleteSelected')}
      />
    </Appbar.Header>
  ) : searching ? (
    <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
      <Searchbar
        autoFocus
        mode="bar"
        value={term}
        onChangeText={setTerm}
        placeholder={t('notes.search')}
        icon="arrow-left"
        onIconPress={clearSearch}
        style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
      />
    </Appbar.Header>
  ) : (
    <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
      <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} accessibilityLabel={t('nav.openMenu')} />
      <Appbar.Content title={title} titleStyle={[styles.title, { color: theme.colors.primary }]} />
      <Appbar.Action icon="magnify" onPress={() => setSearching(true)} accessibilityLabel={t('notes.search')} />
      {menu?.length ? (
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuOpen(true)} accessibilityLabel={t('common.more')} />}>
          {menu.map((item) => (
            <Menu.Item
              key={item.label}
              title={item.label}
              onPress={() => {
                setMenuOpen(false);
                item.onPress();
              }}
            />
          ))}
        </Menu>
      ) : null}
    </Appbar.Header>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {header}
      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={term.trim() ? 'text-search' : 'notebook-outline'}
            title={term.trim() ? t('notes.noResults') : emptyText}
            hint={term.trim() ? undefined : t('notes.emptyHint')}
          />
        }
        renderItem={({ item }) => (
          <SwipeToTrash enabled={!selecting} onTrash={() => trash([item.id])}>
            <NoteCard note={item} selected={selection.has(item.id)} onPress={open} onLongPress={startSelection} />
          </SwipeToTrash>
        )}
      />
      {selecting ? null : (
        <FAB
          icon="pencil"
          onPress={create}
          accessibilityLabel={t('notes.new')}
          style={styles.fab}
          color={theme.colors.onPrimary}
          customSize={60}
          theme={{ colors: { primaryContainer: theme.colors.primary } }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontFamily: titleFont, fontWeight: '600' },
  searchbar: { flex: 1, marginHorizontal: 8, elevation: 0 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  separator: { height: 10 },
  fab: { position: 'absolute', right: 20, bottom: 28, borderRadius: 18 },
});
