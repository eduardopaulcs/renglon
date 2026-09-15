import { router, usePathname, type Href } from 'expo-router';
import { DrawerContentScrollView, type DrawerContentComponentProps } from 'expo-router/drawer';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Divider, Icon, IconButton, Drawer as PaperDrawer, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLiveData } from '@/db/live';
import { createFolder, listFolders } from '@/db/queries/folders';
import { noteCounts } from '@/db/queries/notes';
import { createTag, listTags } from '@/db/queries/tags';
import { t } from '@/i18n';
import { folderIcon } from '@/lib/appearance';
import { APP_VERSION, AUTHOR_NAME, AUTHOR_WEBSITE, AUTHOR_WEBSITE_LABEL } from '@/services/about';
import { tagColors, titleFont, useAppTheme } from '@/theme';

import { FolderIconPicker, TagColorPicker } from './AppearancePicker';
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
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const folders = useLiveData(listFolders, ['folders'], []) ?? [];
  const tags = useLiveData(listTags, ['tags'], []) ?? [];
  const counts = useLiveData(noteCounts, ['notes', 'note_tags', 'folders', 'tags'], []);
  const [creating, setCreating] = useState<'folder' | 'tag' | null>(null);

  // Closing first means the navigation that follows is computed from a closed drawer, so it
  // cannot carry the open state back in.
  const go = (href: Href) => {
    props.navigation.closeDrawer();
    router.navigate(href);
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <DrawerContentScrollView {...props}>
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

          <SectionHeader
            title={t('nav.folders')}
            addLabel={t('nav.newFolder')}
            onAdd={() => setCreating('folder')}
          />
          {folders.length === 0 ? (
            <Text variant="bodySmall" style={[styles.empty, { color: theme.colors.outline }]}>
              {t('nav.noFolders')}
            </Text>
          ) : (
            folders.map((folder) => (
              <PaperDrawer.Item
                key={folder.id}
                icon={folderIcon(folder.icon)}
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
                icon={
                  tag.color
                    ? ({ size }) => <Icon source="tag" size={size} color={tagColors(theme, tag.color).dot} />
                    : 'tag-outline'
                }
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

        {/* Outside the scroll view, so it stays at the bottom however many folders and tags there are. */}
        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.outlineVariant, paddingBottom: insets.bottom + 12 },
          ]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('app.name')} · {t('about.version', { version: APP_VERSION })}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('about.madeBy', { name: AUTHOR_NAME })}
          </Text>
          <Pressable
            onPress={() => void Linking.openURL(AUTHOR_WEBSITE)}
            accessibilityRole="link"
            accessibilityLabel={t('about.openWebsite', { site: AUTHOR_WEBSITE_LABEL })}
            hitSlop={8}
            style={styles.link}>
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
              {AUTHOR_WEBSITE_LABEL}
            </Text>
            <Icon source="open-in-new" size={14} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      <NameDialog
        visible={creating === 'folder'}
        title={t('folders.new')}
        placeholder={t('folders.namePlaceholder')}
        confirmLabel={t('common.create')}
        renderOption={(value, onChange) => <FolderIconPicker value={value} onChange={onChange} />}
        onDismiss={() => setCreating(null)}
        onSubmit={(name, icon) => {
          const folder = createFolder(name, icon);
          setCreating(null);
          go({ pathname: '/folder/[id]', params: { id: String(folder.id) } });
        }}
      />
      <NameDialog
        visible={creating === 'tag'}
        title={t('tags.new')}
        placeholder={t('tags.namePlaceholder')}
        confirmLabel={t('common.create')}
        renderOption={(value, onChange) => <TagColorPicker value={value} onChange={onChange} />}
        onDismiss={() => setCreating(null)}
        onSubmit={(name, color) => {
          const tag = createTag(name, color);
          setCreating(null);
          go({ pathname: '/tag/[id]', params: { id: String(tag.id) } });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 28, paddingTop: 12, gap: 2 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
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
