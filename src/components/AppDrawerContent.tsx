import { router, usePathname, type Href } from 'expo-router';
import { DrawerContentScrollView, type DrawerContentComponentProps } from 'expo-router/drawer';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, IconButton, Drawer as PaperDrawer, Text } from 'react-native-paper';

import { useLiveData } from '@/db/live';
import { createFolder, listFolders } from '@/db/queries/folders';
import { noteCounts } from '@/db/queries/notes';
import { createTag, listTags } from '@/db/queries/tags';
import { t } from '@/i18n';
import { titleFont, useAppTheme } from '@/theme';

import { NameDialog } from './NameDialog';

function Count({ value }: { value?: number }) {
  const theme = useAppTheme();
  return value ? (
    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
      {value}
    </Text>
  ) : null;
}

function SectionHeader({ title, addLabel, onAdd }: { title: string; addLabel: string; onAdd: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {title}
      </Text>
      <IconButton icon="plus" size={20} onPress={onAdd} accessibilityLabel={addLabel} />
    </View>
  );
}

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const theme = useAppTheme();
  const pathname = usePathname();
  const folders = useLiveData(listFolders, ['folders'], []) ?? [];
  const tags = useLiveData(listTags, ['tags'], []) ?? [];
  const counts = useLiveData(noteCounts, ['notes', 'note_tags', 'folders', 'tags'], []);
  const [creating, setCreating] = useState<'folder' | 'tag' | null>(null);

  const go = (href: Href) => {
    router.navigate(href);
    props.navigation.closeDrawer();
  };

  return (
    <>
      <DrawerContentScrollView {...props} style={{ backgroundColor: theme.colors.background }}>
        <Text variant="headlineMedium" style={[styles.brand, { color: theme.colors.primary }]}>
          {t('app.name')}
        </Text>
        <View style={[styles.rule, { backgroundColor: theme.notebook.marginLine }]} />

        <PaperDrawer.Item
          icon="notebook-outline"
          label={t('nav.allNotes')}
          active={pathname === '/'}
          onPress={() => go('/')}
          right={() => <Count value={counts?.all} />}
        />

        <SectionHeader title={t('nav.folders')} addLabel={t('nav.newFolder')} onAdd={() => setCreating('folder')} />
        {folders.length === 0 ? (
          <Text variant="bodySmall" style={[styles.empty, { color: theme.colors.outline }]}>
            {t('nav.noFolders')}
          </Text>
        ) : (
          folders.map((folder) => (
            <PaperDrawer.Item
              key={folder.id}
              icon="folder-outline"
              label={folder.name}
              active={pathname === `/folder/${folder.id}`}
              onPress={() => go({ pathname: '/folder/[id]', params: { id: String(folder.id) } })}
              right={() => <Count value={counts?.byFolder.get(folder.id)} />}
            />
          ))
        )}

        <SectionHeader title={t('nav.tags')} addLabel={t('nav.newTag')} onAdd={() => setCreating('tag')} />
        {tags.length === 0 ? (
          <Text variant="bodySmall" style={[styles.empty, { color: theme.colors.outline }]}>
            {t('nav.noTags')}
          </Text>
        ) : (
          tags.map((tag) => (
            <PaperDrawer.Item
              key={tag.id}
              icon="tag-outline"
              label={tag.name}
              active={pathname === `/tag/${tag.id}`}
              onPress={() => go({ pathname: '/tag/[id]', params: { id: String(tag.id) } })}
              right={() => <Count value={counts?.byTag.get(tag.id)} />}
            />
          ))
        )}

        <Divider style={styles.divider} />
        <PaperDrawer.Item
          icon="trash-can-outline"
          label={t('nav.trash')}
          active={pathname === '/trash'}
          onPress={() => go('/trash')}
          right={() => <Count value={counts?.trash} />}
        />
        <PaperDrawer.Item
          icon="backup-restore"
          label={t('nav.backup')}
          active={pathname === '/backup'}
          onPress={() => go('/backup')}
        />
      </DrawerContentScrollView>

      <NameDialog
        visible={creating === 'folder'}
        title={t('folders.new')}
        placeholder={t('folders.namePlaceholder')}
        confirmLabel={t('common.create')}
        onDismiss={() => setCreating(null)}
        onSubmit={(name) => {
          const folder = createFolder(name);
          setCreating(null);
          go({ pathname: '/folder/[id]', params: { id: String(folder.id) } });
        }}
      />
      <NameDialog
        visible={creating === 'tag'}
        title={t('tags.new')}
        placeholder={t('tags.namePlaceholder')}
        confirmLabel={t('common.create')}
        onDismiss={() => setCreating(null)}
        onSubmit={(name) => {
          const tag = createTag(name);
          setCreating(null);
          go({ pathname: '/tag/[id]', params: { id: String(tag.id) } });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: titleFont, paddingHorizontal: 28, paddingTop: 12 },
  rule: { height: 2, marginHorizontal: 28, marginTop: 8, marginBottom: 12, borderRadius: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 12,
    marginTop: 12,
  },
  empty: { paddingHorizontal: 28, paddingBottom: 8 },
  divider: { marginVertical: 12, marginHorizontal: 28 },
});
