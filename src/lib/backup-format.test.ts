import { BackupFormatError, parseBackup, planMerge } from './backup-format';

const validBackup = () => ({
  app: 'renglon',
  version: 1,
  exportedAt: 1,
  folders: [{ uuid: 'f1', name: 'Work', parentUuid: null, createdAt: 1, updatedAt: 1 }],
  tags: [{ uuid: 't1', name: 'urgent', color: null, createdAt: 1, updatedAt: 1 }],
  notes: [
    {
      uuid: 'n1',
      title: 'Hello',
      body: 'World',
      folderUuid: 'f1',
      tagUuids: ['t1'],
      pinned: false,
      archived: false,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 2,
    },
  ],
});

describe('parseBackup', () => {
  it('accepts a well-formed backup', () => {
    const parsed = parseBackup(validBackup());
    expect(parsed.notes[0].tagUuids).toEqual(['t1']);
    expect(parsed.folders).toHaveLength(1);
  });

  it('rejects files from other apps', () => {
    expect(() => parseBackup({ ...validBackup(), app: 'other' })).toThrow(BackupFormatError);
  });

  it('rejects unknown versions', () => {
    expect(() => parseBackup({ ...validBackup(), version: 99 })).toThrow(/unsupported version/);
  });

  it('points at the offending field', () => {
    const broken = validBackup();
    (broken.notes[0] as Record<string, unknown>).pinned = 'yes';
    expect(() => parseBackup(broken)).toThrow('notes[0].pinned');
  });

  it('rejects non-objects', () => {
    expect(() => parseBackup(null)).toThrow(BackupFormatError);
    expect(() => parseBackup([])).toThrow(BackupFormatError);
  });
});

describe('planMerge', () => {
  it('inserts new records, updates newer ones and skips the rest', () => {
    const existing = new Map([
      ['old', 10],
      ['same', 10],
    ]);
    const plan = planMerge(existing, [
      { uuid: 'new', updatedAt: 5 },
      { uuid: 'old', updatedAt: 20 },
      { uuid: 'same', updatedAt: 10 },
    ]);
    expect(plan).toEqual({ insert: ['new'], update: ['old'], skip: ['same'] });
  });

  it('never lets an older copy overwrite a newer local record', () => {
    expect(planMerge(new Map([['n', 50]]), [{ uuid: 'n', updatedAt: 40 }]).update).toEqual([]);
  });

  it('keeps only the newest copy of a duplicated uuid', () => {
    const plan = planMerge(new Map([['n', 15]]), [
      { uuid: 'n', updatedAt: 10 },
      { uuid: 'n', updatedAt: 20 },
    ]);
    expect(plan.update).toEqual(['n']);
  });
});
