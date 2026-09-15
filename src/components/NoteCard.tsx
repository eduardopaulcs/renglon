import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import type { NoteListItem } from '@/db/queries/notes';
import { formatDate, t } from '@/i18n';
import { stripMarkdown } from '@/lib/markdown';
import { titleFont, useAppTheme } from '@/theme';

interface NoteCardProps {
  note: NoteListItem;
  selected?: boolean;
  /** Replaces the edited date, e.g. with the deletion date in the trash. */
  dateLabel?: string;
  onPress: (note: NoteListItem) => void;
  onLongPress?: (note: NoteListItem) => void;
}

const MAX_TAGS = 3;

export const NoteCard = memo(function NoteCard({ note, selected, dateLabel, onPress, onLongPress }: NoteCardProps) {
  const theme = useAppTheme();
  const preview = stripMarkdown(note.body);
  const extraTags = note.tags.length - MAX_TAGS;

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
            <View style={styles.titleRow}>
              <Text
                variant="titleMedium"
                numberOfLines={1}
                style={[styles.title, { color: note.title ? theme.colors.primary : theme.colors.outline }]}>
                {note.title || t('notes.untitled')}
              </Text>
              {note.pinned ? (
                <Icon source="pin" size={16} color={theme.colors.tertiary} />
              ) : null}
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

            <View style={styles.footer}>
              {note.folder ? (
                <View style={styles.meta}>
                  <Icon source="folder-outline" size={14} color={theme.colors.secondary} />
                  <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.secondary }}>
                    {note.folder.name}
                  </Text>
                </View>
              ) : null}
              {note.tags.slice(0, MAX_TAGS).map((tag) => (
                <View key={tag.id} style={[styles.tag, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSecondaryContainer }}>
                    #{tag.name}
                  </Text>
                </View>
              ))}
              {extraTags > 0 ? (
                <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                  +{extraTags}
                </Text>
              ) : null}
              <Text variant="labelSmall" style={[styles.date, { color: theme.colors.outline }]}>
                {dateLabel ?? formatDate(note.updatedAt)}
              </Text>
            </View>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontFamily: titleFont, fontWeight: '600' },
  preview: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, maxWidth: 140 },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, maxWidth: 120 },
  date: { marginLeft: 'auto' },
});
