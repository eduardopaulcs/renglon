import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import type { NoteListItem } from '@/db/queries/notes';
import { formatDate, t } from '@/i18n';
import { folderIcon } from '@/lib/appearance';
import { notePreview } from '@/lib/markdown';
import { tagColors, titleFont, useAppTheme } from '@/theme';

interface NoteCardProps {
  note: NoteListItem;
  selected?: boolean;
  /** Inside a folder screen every card would repeat the folder name, so it is left out. */
  hideFolder?: boolean;
  /** Replaces the edited date, e.g. with the deletion date in the trash. */
  dateLabel?: string;
  onPress: (note: NoteListItem) => void;
  onLongPress?: (note: NoteListItem) => void;
}

const MAX_TAGS = 3;

export const NoteCard = memo(function NoteCard({
  note,
  selected,
  hideFolder,
  dateLabel,
  onPress,
  onLongPress,
}: NoteCardProps) {
  const theme = useAppTheme();
  const preview = notePreview(note.body);
  const extraTags = note.tags.length - MAX_TAGS;
  const folder = hideFolder ? null : note.folder;
  const hasFooter = folder !== null || note.tags.length > 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
        },
      ]}>
      <TouchableRipple
        onPress={() => onPress(note)}
        onLongPress={onLongPress ? () => onLongPress(note) : undefined}
        accessibilityState={{ selected }}
        borderless>
        <View style={styles.inner}>
          <View style={[styles.margin, { backgroundColor: theme.notebook.marginLine }]} />
          <View style={styles.content}>
            {/* The title takes whatever width is left: pin and date are short and never wrap. */}
            <View style={styles.titleRow}>
              <Text
                variant="titleMedium"
                numberOfLines={1}
                style={[styles.title, { color: note.title ? theme.colors.primary : theme.colors.outline }]}>
                {note.title || t('notes.untitled')}
              </Text>
              {note.pinned ? <Icon source="pin" size={16} color={theme.colors.tertiary} /> : null}
              <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.outline }}>
                {dateLabel ?? formatDate(note.updatedAt)}
              </Text>
              {selected ? <Icon source="check-circle" size={20} color={theme.colors.primary} /> : null}
            </View>

            {preview ? (
              <Text
                variant="bodyMedium"
                numberOfLines={3}
                style={[styles.preview, { color: theme.colors.onSurfaceVariant, borderTopColor: theme.notebook.ruleLine }]}>
                {preview}
              </Text>
            ) : null}

            {hasFooter ? (
              <View style={styles.footer}>
                {folder ? (
                  <View style={[styles.folder, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <Icon source={folderIcon(folder.icon)} size={13} color={theme.colors.onSecondaryContainer} />
                    <Text
                      variant="labelSmall"
                      numberOfLines={1}
                      style={[styles.shrink, { color: theme.colors.onSecondaryContainer }]}>
                      {folder.name}
                    </Text>
                  </View>
                ) : null}
                {note.tags.slice(0, MAX_TAGS).map((tag) => {
                  const colors = tagColors(theme, tag.color);
                  return (
                    <View key={tag.id} style={[styles.tag, { backgroundColor: colors.container }]}>
                      <Text variant="labelSmall" numberOfLines={1} style={[styles.shrink, { color: colors.onContainer }]}>
                        #{tag.name}
                      </Text>
                    </View>
                  );
                })}
                {extraTags > 0 ? (
                  <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                    +{extraTags}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </TouchableRipple>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  inner: { flexDirection: 'row' },
  margin: { width: 3 },
  content: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: titleFont, fontWeight: '600' },
  preview: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6, lineHeight: 20 },
  // Long folder and tag names are cut with an ellipsis instead of pushing the rest off the card.
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  folder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: '50%',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, maxWidth: 120 },
  shrink: { flexShrink: 1 },
});
