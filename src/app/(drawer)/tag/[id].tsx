import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { NameDialog } from '@/components/NameDialog';
import { NotesScreen } from '@/components/NotesScreen';
import { useLiveData } from '@/db/live';
import { TagNameTakenError, deleteTag, getTag, renameTag } from '@/db/queries/tags';
import { t } from '@/i18n';

export default function TagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tagId = Number(id);
  const tag = useLiveData(() => getTag(tagId), ['tags'], [tagId]);
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  // `undefined` means still loading; `null` means the tag no longer exists.
  useEffect(() => {
    if (tag === null) router.replace('/');
  }, [tag]);

  const closeDialog = () => {
    setDialog(null);
    setRenameError(null);
  };

  return (
    <>
      <NotesScreen
        title={tag ? `#${tag.name}` : ''}
        tagId={tagId}
        emptyText={t('notes.emptyTag')}
        menu={[
          { label: t('tags.rename'), onPress: () => setDialog('rename') },
          { label: t('tags.delete'), onPress: () => setDialog('delete') },
        ]}
      />
      <NameDialog
        visible={dialog === 'rename'}
        title={t('tags.rename')}
        placeholder={t('tags.namePlaceholder')}
        confirmLabel={t('common.save')}
        initialValue={tag?.name}
        error={renameError}
        onDismiss={closeDialog}
        onSubmit={(name) => {
          try {
            renameTag(tagId, name);
            closeDialog();
          } catch (error) {
            if (!(error instanceof TagNameTakenError)) throw error;
            setRenameError(t('tags.nameTaken'));
          }
        }}
      />
      <ConfirmDialog
        visible={dialog === 'delete'}
        title={t('tags.delete')}
        message={t('tags.deleteConfirm', { name: tag?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onDismiss={closeDialog}
        onConfirm={() => {
          closeDialog();
          deleteTag(tagId);
        }}
      />
    </>
  );
}
