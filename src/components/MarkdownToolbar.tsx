import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';

import { t, type TranslationKey } from '@/i18n';
import type { FormatKind } from '@/lib/markdown';
import { useAppTheme } from '@/theme';

const ACTIONS: { kind: FormatKind; icon: string; label: TranslationKey }[] = [
  { kind: 'bold', icon: 'format-bold', label: 'format.bold' },
  { kind: 'italic', icon: 'format-italic', label: 'format.italic' },
  { kind: 'heading', icon: 'format-header-1', label: 'format.heading' },
  { kind: 'bullet', icon: 'format-list-bulleted', label: 'format.bullet' },
  { kind: 'numbered', icon: 'format-list-numbered', label: 'format.numbered' },
  { kind: 'checkbox', icon: 'checkbox-marked-outline', label: 'format.checkbox' },
  { kind: 'quote', icon: 'format-quote-close', label: 'format.quote' },
];

export function MarkdownToolbar({ onFormat }: { onFormat: (kind: FormatKind) => void }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.bar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
      <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false}>
        {ACTIONS.map((action) => (
          <IconButton
            key={action.kind}
            icon={action.icon}
            iconColor={theme.colors.primary}
            onPress={() => onFormat(action.kind)}
            accessibilityLabel={t(action.label)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
});
