import { NotesScreen } from '@/components/NotesScreen';
import { t } from '@/i18n';

export default function AllNotesScreen() {
  return <NotesScreen title={t('app.name')} emptyText={t('notes.empty')} showGestureTip />;
}
