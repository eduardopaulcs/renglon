import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, IconButton, Text } from 'react-native-paper';

import { t } from '@/i18n';
import { FOLDER_ICONS, TAG_COLORS, folderIcon, sanitizeTagColor, type TagColor } from '@/lib/appearance';
import { tagColors, useAppTheme } from '@/theme';

interface ChoiceProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function FolderIconPicker({ value, onChange }: ChoiceProps) {
  const theme = useAppTheme();
  const selected = folderIcon(value);

  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('folders.icon')}
      </Text>
      <View style={styles.grid}>
        {FOLDER_ICONS.map((icon) => {
          const active = icon === selected;
          return (
            <IconButton
              key={icon}
              icon={icon}
              size={22}
              style={styles.iconButton}
              mode={active ? 'contained' : undefined}
              containerColor={active ? theme.colors.primary : undefined}
              iconColor={active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              onPress={() => onChange(icon)}
              accessibilityState={{ selected: active }}
            />
          );
        })}
      </View>
    </View>
  );
}

export function TagColorPicker({ value, onChange }: ChoiceProps) {
  const theme = useAppTheme();
  const selected = sanitizeTagColor(value);

  const swatch = (key: TagColor | null) => {
    const active = key === selected;
    const fill = key ? tagColors(theme, key).dot : 'transparent';
    return (
      <Pressable
        key={key ?? 'none'}
        onPress={() => onChange(key)}
        accessibilityRole="button"
        accessibilityLabel={key ? t(`color.${key}`) : t('tags.noColor')}
        accessibilityState={{ selected: active }}
        style={[
          styles.swatch,
          { backgroundColor: fill, borderColor: active ? theme.colors.primary : key ? fill : theme.colors.outline },
        ]}>
        {active ? (
          <Icon source="check" size={18} color={key ? theme.colors.surface : theme.colors.primary} />
        ) : key === null ? (
          <Icon source="cancel" size={18} color={theme.colors.outline} />
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('tags.color')}
      </Text>
      <View style={styles.grid}>
        {swatch(null)}
        {TAG_COLORS.map((key) => swatch(key))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconButton: { margin: 0 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
