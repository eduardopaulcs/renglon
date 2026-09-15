import { useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Text } from 'react-native-paper';

import { useSnackbar } from '@/components/SnackbarProvider';
import { exportBackup, importBackup } from '@/db/queries/backup';
import { t } from '@/i18n';
import { BackupFormatError, parseBackup } from '@/lib/backup-format';
import { pickTextFile, shareTextFile } from '@/services/files';
import { titleFont, useAppTheme } from '@/theme';

export default function BackupScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>();
  const showSnackbar = useSnackbar();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const runExport = async () => {
    setBusy('export');
    try {
      const date = new Date().toISOString().slice(0, 10);
      await shareTextFile(
        `renglon-backup-${date}.json`,
        JSON.stringify(exportBackup(), null, 2),
        'application/json',
        t('backup.shareDialog')
      );
    } catch {
      showSnackbar(t('common.failed'));
    } finally {
      setBusy(null);
    }
  };

  const runImport = async () => {
    setBusy('import');
    try {
      const text = await pickTextFile();
      if (text === null) return;

      let backup;
      try {
        backup = parseBackup(JSON.parse(text));
      } catch (error) {
        // Malformed JSON and a valid JSON with the wrong shape are the same problem for the user.
        if (error instanceof SyntaxError || error instanceof BackupFormatError) {
          showSnackbar(t('backup.invalid'));
          return;
        }
        throw error;
      }

      showSnackbar(t('backup.imported', importBackup(backup)));
    } catch {
      showSnackbar(t('common.failed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} accessibilityLabel={t('nav.openMenu')} />
        <Appbar.Content title={t('nav.backup')} titleStyle={[styles.title, { color: theme.colors.primary }]} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
          <Card.Title title={t('backup.exportTitle')} titleStyle={styles.cardTitle} />
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('backup.exportBody')}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              icon="export-variant"
              loading={busy === 'export'}
              disabled={busy !== null}
              onPress={runExport}>
              {t('backup.exportAction')}
            </Button>
          </Card.Actions>
        </Card>

        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
          <Card.Title title={t('backup.importTitle')} titleStyle={styles.cardTitle} />
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('backup.importBody')}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="outlined"
              icon="file-import-outline"
              loading={busy === 'import'}
              disabled={busy !== null}
              onPress={runImport}>
              {t('backup.importAction')}
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontFamily: titleFont, fontWeight: '600' },
  content: { padding: 16, gap: 16 },
  cardTitle: { fontFamily: titleFont, fontWeight: '600' },
});
