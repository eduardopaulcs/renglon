import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ActivityIndicator, Appbar, Chip, Menu, Text } from 'react-native-paper';

import { FolderPickerDialog } from '@/components/FolderPickerDialog';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { MarkdownToolbar } from '@/components/MarkdownToolbar';
import { RuledEditor } from '@/components/RuledEditor';
import { useSnackbar } from '@/components/SnackbarProvider';
import { TagPickerDialog } from '@/components/TagPickerDialog';
import { useLiveData } from '@/db/live';
import {
  deleteNotesForever,
  getNoteItem,
  restoreNotes,
  setNoteFolder,
  setNotePinned,
  setNoteTags,
  trashNotes,
  updateNoteContent,
  type NoteListItem,
} from '@/db/queries/notes';
import { formatDate, t, tp } from '@/i18n';
import { applyFormat, noteToMarkdown, safeFileName, type FormatKind, type TextSelection } from '@/lib/markdown';
import { shareTextFile } from '@/services/files';
import { titleFont, useAppTheme } from '@/theme';

const AUTOSAVE_DELAY_MS = 600;

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = Number(id);
  const theme = useAppTheme();
  const note = useLiveData(() => getNoteItem(noteId), ['notes', 'note_tags', 'tags', 'folders'], [noteId]);

  // `undefined` means still loading; `null` means the note no longer exists.
  useEffect(() => {
    if (note === null) router.back();
  }, [note]);

  if (!note) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  // Keyed by id so the editor's local text state is created from the note exactly once.
  return <NoteEditor key={note.id} note={note} />;
}

function NoteEditor({ note }: { note: NoteListItem }) {
  const noteId = note.id;
  const theme = useAppTheme();
  const showSnackbar = useSnackbar();

  // Seeded once from the note. Later refetches (triggered by autosave itself) keep updating
  // `note` for the metadata, but must not overwrite what the user is typing.
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [bodyFocused, setBodyFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [picker, setPicker] = useState<'tags' | 'folder' | null>(null);
  const [selection, setSelection] = useState<TextSelection>({ start: 0, end: 0 });
  const [forcedSelection, setForcedSelection] = useState<TextSelection>();
  const bodyRef = useRef<TextInput>(null);

  // The exit handler runs on unmount, when state is no longer reachable, so it reads these refs.
  const latest = useRef({ title: note.title, body: note.body, tagCount: note.tags.length });
  const edited = useRef(false);
  const skipExitHandling = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    latest.current.tagCount = note.tags.length;
  }, [note.tags.length]);

  const scheduleSave = (next: { title: string; body: string }) => {
    latest.current = { ...latest.current, ...next };
    edited.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateNoteContent(noteId, next), AUTOSAVE_DELAY_MS);
  };

  // Leaving the screen: flush the pending save and tell the user it happened, or throw away a
  // note that was left completely empty so it does not clutter the list as "Untitled".
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      if (skipExitHandling.current) return;

      const current = latest.current;
      if (!current.title.trim() && !current.body.trim() && current.tagCount === 0) {
        deleteNotesForever([noteId]);
        if (edited.current) showSnackbar(t('editor.discarded'));
        return;
      }
      if (edited.current) {
        updateNoteContent(noteId, { title: current.title, body: current.body });
        showSnackbar(t('editor.saved'));
      }
    },
    [noteId, showSnackbar]
  );

  const format = (kind: FormatKind) => {
    const result = applyFormat(body, selection, kind);
    setBody(result.text);
    setSelection(result.selection);
    setForcedSelection(result.selection);
    scheduleSave({ title, body: result.text });
  };

  const openPicker = (which: 'tags' | 'folder') => {
    setMenuOpen(false);
    setPicker(which);
  };

  const trash = () => {
    setMenuOpen(false);
    skipExitHandling.current = true;
    clearTimeout(saveTimer.current);
    if (edited.current) updateNoteContent(noteId, { title, body });
    trashNotes([noteId]);
    router.back();
    showSnackbar(tp('notes.trashed', 1), { label: t('common.undo'), onPress: () => restoreNotes([noteId]) });
  };

  const share = async () => {
    setMenuOpen(false);
    await shareTextFile(
      safeFileName(title, t('notes.untitled'), 'md'),
      noteToMarkdown(title, body),
      'text/markdown',
      t('editor.share')
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} accessibilityLabel={t('common.back')} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon={note.pinned ? 'pin' : 'pin-outline'}
          color={note.pinned ? theme.colors.tertiary : undefined}
          onPress={() => setNotePinned(noteId, !note.pinned)}
          accessibilityLabel={note.pinned ? t('editor.unpin') : t('editor.pin')}
        />
        <Appbar.Action
          icon={mode === 'edit' ? 'eye-outline' : 'pencil-outline'}
          onPress={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
          accessibilityLabel={mode === 'edit' ? t('editor.preview') : t('editor.edit')}
        />
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" onPress={() => setMenuOpen(true)} accessibilityLabel={t('common.more')} />
          }>
          <Menu.Item leadingIcon="tag-outline" title={t('editor.tags')} onPress={() => openPicker('tags')} />
          <Menu.Item leadingIcon="folder-outline" title={t('editor.folder')} onPress={() => openPicker('folder')} />
          <Menu.Item leadingIcon="share-variant-outline" title={t('editor.share')} onPress={share} />
          <Menu.Item
            leadingIcon="trash-can-outline"
            title={t('editor.delete')}
            titleStyle={{ color: theme.colors.error }}
            onPress={trash}
          />
        </Menu>
      </Appbar.Header>

      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <TextInput
            value={title}
            placeholder={t('editor.titlePlaceholder')}
            placeholderTextColor={theme.colors.outline}
            onChangeText={(value) => {
              setTitle(value);
              scheduleSave({ title: value, body });
            }}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => bodyRef.current?.focus()}
            editable={mode === 'edit'}
            style={[styles.title, { color: theme.colors.primary }]}
          />

          <View style={styles.meta}>
            <Chip compact icon="folder-outline" onPress={() => setPicker('folder')} style={styles.chip}>
              {note.folder?.name ?? t('editor.noFolder')}
            </Chip>
            {note.tags.map((tag) => (
              <Chip key={tag.id} compact onPress={() => setPicker('tags')} style={styles.chip}>
                #{tag.name}
              </Chip>
            ))}
            {note.tags.length === 0 ? (
              <Chip compact icon="tag-plus-outline" onPress={() => setPicker('tags')} style={styles.chip}>
                {t('editor.addTags')}
              </Chip>
            ) : null}
          </View>
          <Text variant="labelSmall" style={[styles.edited, { color: theme.colors.outline }]}>
            {t('editor.edited', { date: formatDate(note.updatedAt) })}
          </Text>

          {mode === 'edit' ? (
            <RuledEditor
              inputRef={bodyRef}
              value={body}
              placeholder={t('editor.bodyPlaceholder')}
              selection={forcedSelection}
              onChangeText={(value) => {
                setBody(value);
                scheduleSave({ title, body: value });
              }}
              onSelectionChange={(next) => {
                setSelection(next);
                if (forcedSelection) setForcedSelection(undefined);
              }}
              onFocus={() => setBodyFocused(true)}
              onBlur={() => setBodyFocused(false)}
            />
          ) : (
            <MarkdownPreview value={body} />
          )}
        </ScrollView>

        {mode === 'edit' && bodyFocused ? <MarkdownToolbar onFormat={format} /> : null}
      </KeyboardAvoidingView>

      <TagPickerDialog
        visible={picker === 'tags'}
        selectedIds={note.tags.map((tag) => tag.id)}
        onChange={(ids) => setNoteTags(noteId, ids)}
        onDismiss={() => setPicker(null)}
      />
      <FolderPickerDialog
        visible={picker === 'folder'}
        selectedId={note.folderId}
        onSelect={(folderId) => setNoteFolder(noteId, folderId)}
        onDismiss={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 48 },
  title: {
    fontFamily: titleFont,
    fontSize: 26,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16 },
  chip: { borderRadius: 999 },
  edited: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
});
