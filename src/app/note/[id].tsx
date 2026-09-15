import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Chip, Dialog, List, Menu, Portal, Text } from 'react-native-paper';

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
  setNotesFolder,
  setNotesPinned,
  trashNotes,
  updateNoteContent,
  type NoteListItem,
} from '@/db/queries/notes';
import { formatDate, t, tp } from '@/i18n';
import { folderIcon } from '@/lib/appearance';
import {
  applyFormat,
  noteToMarkdown,
  noteToPlainText,
  safeFileName,
  type FormatKind,
  type TextSelection,
} from '@/lib/markdown';
import { shareTextFile } from '@/services/files';
import { tagColors, titleFont, useAppTheme } from '@/theme';

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
  const [shareOpen, setShareOpen] = useState(false);
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

  const openShare = () => {
    setMenuOpen(false);
    setShareOpen(true);
  };

  // Plain text goes out as text, so chat and mail apps paste it straight into the message.
  // Markdown goes out as a .md file, which is what editors and file apps expect.
  const shareAs = async (format: 'plain' | 'markdown') => {
    setShareOpen(false);
    if (format === 'plain') {
      await Share.share({ title: title.trim() || undefined, message: noteToPlainText(title, body) });
    } else {
      await shareTextFile(
        safeFileName(title, t('notes.untitled'), 'md'),
        noteToMarkdown(title, body),
        'text/markdown',
        t('editor.share')
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} accessibilityLabel={t('common.back')} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon={note.pinned ? 'pin' : 'pin-outline'}
          color={note.pinned ? theme.colors.tertiary : undefined}
          onPress={() => setNotesPinned([noteId], !note.pinned)}
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
          <Menu.Item leadingIcon="folder-outline" title={t('editor.folder')} onPress={() => openPicker('folder')} />
          <Menu.Item leadingIcon="tag-outline" title={t('editor.tags')} onPress={() => openPicker('tags')} />
          <Menu.Item leadingIcon="share-variant-outline" title={t('editor.share')} onPress={openShare} />
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
            <Chip
              compact
              icon={note.folder ? folderIcon(note.folder.icon) : 'folder-outline'}
              onPress={() => setPicker('folder')}
              style={styles.chip}>
              {note.folder?.name ?? t('editor.noFolder')}
            </Chip>
            {note.tags.map((tag) => {
              const colors = tagColors(theme, tag.color);
              return (
                <Chip
                  key={tag.id}
                  compact
                  onPress={() => setPicker('tags')}
                  style={[styles.chip, { backgroundColor: colors.container }]}
                  textStyle={{ color: colors.onContainer }}>
                  #{tag.name}
                </Chip>
              );
            })}
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
        noteIds={[noteId]}
        onDismiss={() => setPicker(null)}
      />
      <FolderPickerDialog
        visible={picker === 'folder'}
        selectedId={note.folderId}
        onSelect={(folderId) => setNotesFolder([noteId], folderId)}
        onDismiss={() => setPicker(null)}
      />
      <Portal>
        <Dialog visible={shareOpen} onDismiss={() => setShareOpen(false)}>
          <Dialog.Title>{t('editor.shareAs')}</Dialog.Title>
          <Dialog.Content style={styles.shareOptions}>
            <List.Item
              title={t('editor.sharePlain')}
              description={t('editor.sharePlainHint')}
              left={(props) => <List.Icon {...props} icon="text" />}
              onPress={() => shareAs('plain')}
            />
            <List.Item
              title={t('editor.shareMarkdown')}
              description={t('editor.shareMarkdownHint')}
              left={(props) => <List.Icon {...props} icon="language-markdown-outline" />}
              onPress={() => shareAs('markdown')}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShareOpen(false)}>{t('common.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  shareOptions: { paddingHorizontal: 8 },
});
