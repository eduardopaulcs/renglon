import { Fragment } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { useMarkdown } from 'react-native-marked';
import { Text } from 'react-native-paper';

import { t } from '@/i18n';
import { titleFont, useAppTheme } from '@/theme';

export function MarkdownPreview({ value }: { value: string }) {
  const theme = useAppTheme();
  const colorScheme = useColorScheme();

  const heading = { fontFamily: titleFont, color: theme.colors.primary, fontWeight: '600' as const };
  const elements = useMarkdown(value, {
    colorScheme,
    theme: {
      colors: {
        text: theme.colors.onSurface,
        link: theme.colors.tertiary,
        code: theme.colors.surfaceVariant,
        border: theme.colors.outlineVariant,
      },
    },
    styles: {
      text: { fontSize: 17, lineHeight: 26, color: theme.colors.onSurface },
      h1: { ...heading, fontSize: 26 },
      h2: { ...heading, fontSize: 22 },
      h3: { ...heading, fontSize: 19 },
      blockquote: { borderLeftColor: theme.notebook.marginLine, backgroundColor: 'transparent' },
    },
  });

  if (!value.trim()) {
    return (
      <Text variant="bodyLarge" style={[styles.empty, { color: theme.colors.outline }]}>
        {t('editor.previewEmpty')}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {elements.map((element, index) => (
        <Fragment key={index}>{element}</Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 4 },
  empty: { paddingHorizontal: 20, paddingTop: 12 },
});
