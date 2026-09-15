import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { titleFont, useAppTheme } from '@/theme';

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <Icon source={icon} size={56} color={theme.colors.outline} />
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
        {title}
      </Text>
      {hint ? (
        <Text variant="bodyMedium" style={[styles.hint, { color: theme.colors.outline }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 96, paddingHorizontal: 40, gap: 8 },
  title: { fontFamily: titleFont, textAlign: 'center', marginTop: 8 },
  hint: { textAlign: 'center' },
});
