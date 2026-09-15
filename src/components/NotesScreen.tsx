import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, FlatList, StyleSheet, View } from 'react-native';
import { Appbar, FAB, Menu, Searchbar } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useLiveData } from '@/db/live';
import { getFolder, listFolders } from '@/db/queries/folders';
import {
  NOTE_PAGE_SIZE,
  createNote,
  listNotes,
  restoreNotes,
  searchNoteIds,
  setNotesFolder,
  setNotesPinned,
  trashNotes,
  type NoteListItem,
  type NotePage,
} from '@/db/queries/notes';
import { listTags } from '@/db/queries/tags';
import { t, tp } from '@/i18n';
import { titleFont, useAppTheme } from '@/theme';

import { EmptyState } from './EmptyState';
import { FolderPickerDialog } from './FolderPickerDialog';
import { NoteCard } from './NoteCard';
import { NoteFilters, type FolderFilter } from './NoteFilters';
import { useSnackbar, useSnackbarOffset } from './SnackbarProvider';
import { SwipeToTrash } from './SwipeToTrash';
import { TagPickerDialog } from './TagPickerDialog';

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

const EMPTY_PAGE: NotePage = { items: [], hasMore: false };
const FAB_BOTTOM = 28;

/**
 * The note list shared by "All notes", a folder and a tag. Notes created from a folder or tag
 * screen, or while filters are on, start inside that folder and with those tags, so they do not
 * vanish from the list the user was looking at.
 */
export function NotesScreen({ title, folderId, tagId, emptyText, menu }: NotesScreenProps) {
  const theme = useAppTheme();
  const navigation = useNavigation<DrawerNavigation>();
  const showSnackbar = useSnackbar();
  const snackbarOffset = useSnackbarOffset();

  const [searching, setSearching] = useState(false);
  const [term, setTerm] = useState('');
  const [selection, setSelection] = useState<ReadonlySet<number>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [tagging, setTagging] = useState(false);

  const folders = useLiveData(listFolders, ['folders'], []) ?? [];
  const allTags = useLiveData(listTags, ['tags'], []) ?? [];
  const [folderFilter, setFolderFilter] = useState<FolderFilter>();
  const [tagFilter, setTagFilter] = useState<number[]>([]);

  // A filter pointing at a folder or tag deleted in the meantime is ignored, instead of leaving
  // an empty list with no visible reason. A folder screen has no folder filter of its own.
  const filterTags = allTags.filter((tag) => tag.id !== tagId);
  const activeFolderFilter =
    folderId === undefined && (folderFilter === null || folders.some((folder) => folder.id === folderFilter))
      ? folderFilter
      : undefined;
  const activeTagFilter = tagFilter.filter((id) => filterTags.some((tag) => tag.id === id));
  const filtersActive = activeFolderFilter !== undefined || activeTagFilter.length > 0;
  const effectiveFolderId = folderId ?? activeFolderFilter;
  const effectiveTagIds = tagId === undefined ? activeTagFilter : [tagId, ...activeTagFilter];

  // The page limit belongs to one filter: a new search, folder or tag starts again from the
  // first page instead of rendering every row the previous list had loaded.
  const filterKey = `${effectiveFolderId}:${effectiveTagIds.join(',')}:${term.trim()}`;
  const [page, setPage] = useState({ key: filterKey, limit: NOTE_PAGE_SIZE });
  const limit = page.key === filterKey ? page.limit : NOTE_PAGE_SIZE;

  const { items: notes, hasMore } =
    useLiveData(
      () =>
        listNotes(
          { folderId: effectiveFolderId, tagIds: effectiveTagIds, ids: term.trim() ? searchNoteIds(term) : undefined },
          limit
        ),
      ['notes', 'note_tags', 'tags', 'folders'],
      [effectiveFolderId, effectiveTagIds.join(','), term, limit]
    ) ?? EMPTY_PAGE;

  const loadMore = () => {
    if (hasMore) setPage({ key: filterKey, limit: limit + NOTE_PAGE_SIZE });
  };

  const selecting = selection.size > 0;
  const selectedIds = [...selection];
  const selectedNotes = notes.filter((note) => selection.has(note.id));
  const allPinned = selectedNotes.length > 0 && selectedNotes.every((note) => note.pinned);
  const sharedFolderId = selectedNotes.every((note) => note.folderId === selectedNotes[0]?.folderId)
    ? selectedNotes[0]?.folderId
    : undefined;

  // The FAB moves up while a snackbar is showing instead of being covered by it.
  const fabLift = useSharedValue(0);
  useEffect(() => {
    fabLift.set(withTiming(Math.max(0, snackbarOffset - FAB_BOTTOM), { duration: 200 }));
  }, [fabLift, snackbarOffset]);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -fabLift.get() }] }));

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

  const togglePinned = () => {
    setNotesPinned(selectedIds, !allPinned);
    setSelection(new Set());
  };

  const move = (targetFolderId: number | null) => {
    setNotesFolder(selectedIds, targetFolderId);
    setSelection(new Set());
    showSnackbar(
      targetFolderId === null
        ? tp('notes.removedFromFolder', selectedIds.length)
        : tp('notes.moved', selectedIds.length, { folder: getFolder(targetFolderId)?.name ?? '' })
    );
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
    const note = createNote({ folderId: effectiveFolderId, tagIds: effectiveTagIds });
    router.push({ pathname: '/note/[id]', params: { id: String(note.id) } });
  };

  const header = selecting ? (
    <Appbar.Header style={{ backgroundColor: theme.colors.primaryContainer }}>
      <Appbar.Action icon="close" onPress={() => setSelection(new Set())} accessibilityLabel={t('notes.clearSelection')} />
      <Appbar.Content title={tp('notes.selected', selection.size)} />
      <Appbar.Action
        icon={allPinned ? 'pin-off-outline' : 'pin-outline'}
        onPress={togglePinned}
        accessibilityLabel={allPinned ? t('notes.unpinSelected') : t('notes.pinSelected')}
      />
      <Appbar.Action
        icon="folder-move-outline"
        onPress={() => setMoving(true)}
        accessibilityLabel={t('notes.moveSelected')}
      />
      <Appbar.Action
        icon="tag-multiple-outline"
        onPress={() => setTagging(true)}
        accessibilityLabel={t('notes.tagSelected')}
      />
      <Appbar.Action
        icon="trash-can-outline"
        onPress={() => trash(selectedIds)}
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
        // Tapping outside closes an empty search. With a term typed, only the keyboard goes
        // away, so the results stay on screen to be browsed.
        onBlur={() => {
          if (!term.trim()) clearSearch();
        }}
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
      <NoteFilters
        folders={folders}
        tags={filterTags}
        showFolder={folderId === undefined}
        folderValue={activeFolderFilter}
        onFolderChange={setFolderFilter}
        tagIds={activeTagFilter}
        onTagIdsChange={setTagFilter}
      />
      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            icon={term.trim() ? 'text-search' : 'notebook-outline'}
            title={term.trim() ? t('notes.noResults') : filtersActive ? t('notes.noFilterResults') : emptyText}
            hint={term.trim() || filtersActive ? undefined : t('notes.emptyHint')}
          />
        }
        renderItem={({ item }) => (
          <SwipeToTrash enabled={!selecting} onTrash={() => trash([item.id])}>
            <NoteCard
              note={item}
              selected={selection.has(item.id)}
              hideFolder={folderId !== undefined}
              onPress={open}
              onLongPress={startSelection}
            />
          </SwipeToTrash>
        )}
      />
      {selecting ? null : (
        <Animated.View style={[styles.fab, fabStyle]}>
          <FAB
            icon="pencil"
            onPress={create}
            accessibilityLabel={t('notes.new')}
            style={styles.fabButton}
            color={theme.colors.onPrimary}
            customSize={60}
            theme={{ colors: { primaryContainer: theme.colors.primary } }}
          />
        </Animated.View>
      )}
      <FolderPickerDialog
        visible={moving}
        selectedId={sharedFolderId}
        onSelect={move}
        onDismiss={() => setMoving(false)}
      />
      {/* Tag changes apply while the dialog is open; closing it finishes the bulk action. */}
      <TagPickerDialog
        visible={tagging}
        noteIds={selectedIds}
        onDismiss={() => {
          setTagging(false);
          setSelection(new Set());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontFamily: titleFont, fontWeight: '600' },
  searchbar: { flex: 1, marginHorizontal: 8, elevation: 0 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  separator: { height: 10 },
  fab: { position: 'absolute', right: 20, bottom: FAB_BOTTOM },
  fabButton: { borderRadius: 18 },
});
