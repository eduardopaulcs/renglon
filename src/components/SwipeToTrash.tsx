import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Icon } from 'react-native-paper';

import { t } from '@/i18n';
import { useAppTheme } from '@/theme';

const ACTION_WIDTH = 96;

interface SwipeToTrashProps {
  enabled: boolean;
  onTrash: () => void;
  children: ReactNode;
}

/**
 * Swiping either way sends the note to the trash as soon as the panel opens. There is no second
 * tap to confirm because the snackbar that follows offers Undo, which is faster and less
 * annoying than a confirmation for a recoverable action.
 */
function TrashAction({ align }: { align: 'flex-start' | 'flex-end' }) {
  const theme = useAppTheme();
  return (
    <View
      accessibilityLabel={t('common.delete')}
      style={[styles.action, { alignItems: align, backgroundColor: theme.colors.tertiary }]}>
      <Icon source="trash-can-outline" size={24} color={theme.colors.onTertiary} />
    </View>
  );
}

export function SwipeToTrash({ enabled, onTrash, children }: SwipeToTrashProps) {
  return (
    <ReanimatedSwipeable
      enabled={enabled}
      friction={1.5}
      leftThreshold={ACTION_WIDTH / 2}
      rightThreshold={ACTION_WIDTH / 2}
      renderLeftActions={() => <TrashAction align="flex-start" />}
      renderRightActions={() => <TrashAction align="flex-end" />}
      onSwipeableOpen={onTrash}
      containerStyle={styles.container}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 14 },
  action: { width: ACTION_WIDTH, justifyContent: 'center', paddingHorizontal: 28, borderRadius: 14 },
});
