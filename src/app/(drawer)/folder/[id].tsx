import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { FolderIconPicker } from '@/components/AppearancePicker';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { NameDialog } from '@/components/NameDialog';
import { NotesScreen } from '@/components/NotesScreen';
import { useLiveData } from '@/db/live';
import { deleteFolder, getFolder, updateFolder } from '@/db/queries/folders';
import { t } from '@/i18n';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const folderId = Number(id);
  const folder = useLiveData(() => getFolder(folderId), ['folders'], [folderId]);
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);

  // `undefined` means still loading; `null` means the folder no longer exists.
  useEffect(() => {
    if (folder === null) router.replace('/');
  }, [folder]);

  return (
    <>
      <NotesScreen
        title={folder?.name ?? ''}
        folderId={folderId}
        emptyText={t('notes.emptyFolder')}
        menu={[
          { label: t('folders.edit'), onPress: () => setDialog('edit') },
          { label: t('folders.delete'), onPress: () => setDialog('delete') },
        ]}
      />
      <NameDialog
        visible={dialog === 'edit'}
        title={t('folders.edit')}
        placeholder={t('folders.namePlaceholder')}
        confirmLabel={t('common.save')}
        initialValue={folder?.name}
        initialOption={folder?.icon}
        renderOption={(value, onChange) => <FolderIconPicker value={value} onChange={onChange} />}
        onDismiss={() => setDialog(null)}
        onSubmit={(name, icon) => {
          updateFolder(folderId, { name, icon });
          setDialog(null);
        }}
      />
      <ConfirmDialog
        visible={dialog === 'delete'}
        title={t('folders.delete')}
        message={t('folders.deleteConfirm', { name: folder?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onDismiss={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          deleteFolder(folderId);
        }}
      />
    </>
  );
}
