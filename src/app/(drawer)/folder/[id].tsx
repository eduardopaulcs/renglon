import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { FolderIconPicker } from '@/components/AppearancePicker';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { NameDialog } from '@/components/NameDialog';
import { NotesScreen } from '@/components/NotesScreen';
import { TipBanner } from '@/components/TipBanner';
import { useLiveData } from '@/db/live';
import { deleteFolder, getFolder, updateFolder } from '@/db/queries/folders';
import { t } from '@/i18n';
import { useTip } from '@/services/tips';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const folderId = Number(id);
  const folder = useLiveData(() => getFolder(folderId), ['folders'], [folderId]);
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);
  const iconTip = useTip('folderIcon');

  // `undefined` means still loading; `null` means the folder no longer exists.
  useEffect(() => {
    if (folder === null) router.replace('/');
  }, [folder]);

  const openEdit = () => {
    iconTip.dismiss();
    setDialog('edit');
  };

  return (
    <>
      <NotesScreen
        title={folder?.name ?? ''}
        folderId={folderId}
        emptyText={t('notes.emptyFolder')}
        menu={[
          { label: t('folders.edit'), onPress: openEdit },
          { label: t('folders.delete'), onPress: () => setDialog('delete') },
        ]}
        banner={
          <TipBanner
            visible={iconTip.visible}
            icon="shape-outline"
            text={t('tips.folderIcon')}
            action={{ label: t('tips.folderIconAction'), onPress: openEdit }}
            onDismiss={iconTip.dismiss}
          />
        }
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
