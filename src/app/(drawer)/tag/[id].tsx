import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { TagColorPicker } from '@/components/AppearancePicker';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { NameDialog } from '@/components/NameDialog';
import { NotesScreen } from '@/components/NotesScreen';
import { TipBanner } from '@/components/TipBanner';
import { useLiveData } from '@/db/live';
import { TagNameTakenError, deleteTag, getTag, updateTag } from '@/db/queries/tags';
import { t } from '@/i18n';
import { useTip } from '@/services/tips';

export default function TagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tagId = Number(id);
  const tag = useLiveData(() => getTag(tagId), ['tags'], [tagId]);
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const colorTip = useTip('tagColor');

  // `undefined` means still loading; `null` means the tag no longer exists.
  useEffect(() => {
    if (tag === null) router.replace('/');
  }, [tag]);

  const openEdit = () => {
    colorTip.dismiss();
    setDialog('edit');
  };

  const closeDialog = () => {
    setDialog(null);
    setEditError(null);
  };

  return (
    <>
      <NotesScreen
        title={tag ? `#${tag.name}` : ''}
        tagId={tagId}
        emptyText={t('notes.emptyTag')}
        menu={[
          { label: t('tags.edit'), onPress: openEdit },
          { label: t('tags.delete'), onPress: () => setDialog('delete') },
        ]}
        banner={
          <TipBanner
            visible={colorTip.visible}
            icon="palette-outline"
            text={t('tips.tagColor')}
            action={{ label: t('tips.tagColorAction'), onPress: openEdit }}
            onDismiss={colorTip.dismiss}
          />
        }
      />
      <NameDialog
        visible={dialog === 'edit'}
        title={t('tags.edit')}
        placeholder={t('tags.namePlaceholder')}
        confirmLabel={t('common.save')}
        initialValue={tag?.name}
        initialOption={tag?.color}
        renderOption={(value, onChange) => <TagColorPicker value={value} onChange={onChange} />}
        error={editError}
        onDismiss={closeDialog}
        onSubmit={(name, color) => {
          try {
            updateTag(tagId, { name, color });
            closeDialog();
          } catch (error) {
            if (!(error instanceof TagNameTakenError)) throw error;
            setEditError(t('tags.nameTaken'));
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
