import { sanitizeFolderIcon, sanitizeTagColor } from './appearance';

export const BACKUP_APP = 'renglon';
export const BACKUP_VERSION = 1;

export interface BackupFolder {
  uuid: string;
  name: string;
  parentUuid: string | null;
  icon: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface BackupTag {
  uuid: string;
  name: string;
  color: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface BackupNote {
  uuid: string;
  title: string;
  body: string;
  folderUuid: string | null;
  tagUuids: string[];
  pinned: boolean;
  archived: boolean;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: number;
  folders: BackupFolder[];
  tags: BackupTag[];
  notes: BackupNote[];
}

export class BackupFormatError extends Error {
  constructor(reason: string) {
    super(`Invalid backup: ${reason}`);
    this.name = 'BackupFormatError';
  }
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function field<T>(record: Json, name: string, check: (v: unknown) => v is T, where: string): T {
  const value = record[name];
  if (!check(value)) throw new BackupFormatError(`${where}.${name} has the wrong type`);
  return value;
}

function optional<T>(record: Json, name: string, check: (v: unknown) => v is T, where: string): T | undefined {
  return record[name] === undefined ? undefined : field(record, name, check, where);
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
const isNullableString = (v: unknown): v is string | null => v === null || isString(v);
const isNullableNumber = (v: unknown): v is number | null => v === null || isNumber(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

function list(root: Json, name: string): Json[] {
  const value = root[name];
  if (!Array.isArray(value) || !value.every(isObject)) {
    throw new BackupFormatError(`${name} must be a list of objects`);
  }
  return value;
}

/**
 * Validates an imported file field by field. The file comes from outside the app, so nothing
 * about its shape is trusted: a hand-edited or foreign JSON must be rejected before any write,
 * not halfway through a transaction.
 */
export function parseBackup(raw: unknown): Backup {
  if (!isObject(raw)) throw new BackupFormatError('the root is not an object');
  if (raw.app !== BACKUP_APP) throw new BackupFormatError('it was not created by Renglón');
  if (raw.version !== BACKUP_VERSION) throw new BackupFormatError(`unsupported version ${String(raw.version)}`);

  const folders = list(raw, 'folders').map((item, i) => {
    const where = `folders[${i}]`;
    return {
      uuid: field(item, 'uuid', isString, where),
      name: field(item, 'name', isString, where),
      parentUuid: field(item, 'parentUuid', isNullableString, where),
      // Optional because backups made before folders had icons do not have the field.
      icon: sanitizeFolderIcon(optional(item, 'icon', isNullableString, where) ?? null),
      createdAt: field(item, 'createdAt', isNumber, where),
      updatedAt: field(item, 'updatedAt', isNumber, where),
    };
  });

  const tags = list(raw, 'tags').map((item, i) => {
    const where = `tags[${i}]`;
    return {
      uuid: field(item, 'uuid', isString, where),
      name: field(item, 'name', isString, where),
      color: sanitizeTagColor(field(item, 'color', isNullableString, where)),
      createdAt: field(item, 'createdAt', isNumber, where),
      updatedAt: field(item, 'updatedAt', isNumber, where),
    };
  });

  const notes = list(raw, 'notes').map((item, i) => {
    const where = `notes[${i}]`;
    return {
      uuid: field(item, 'uuid', isString, where),
      title: field(item, 'title', isString, where),
      body: field(item, 'body', isString, where),
      folderUuid: field(item, 'folderUuid', isNullableString, where),
      tagUuids: field(item, 'tagUuids', isStringArray, where),
      pinned: field(item, 'pinned', isBoolean, where),
      archived: field(item, 'archived', isBoolean, where),
      deletedAt: field(item, 'deletedAt', isNullableNumber, where),
      createdAt: field(item, 'createdAt', isNumber, where),
      updatedAt: field(item, 'updatedAt', isNumber, where),
    };
  });

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: isNumber(raw.exportedAt) ? raw.exportedAt : 0,
    folders,
    tags,
    notes,
  };
}

export interface MergePlan {
  insert: string[];
  update: string[];
  skip: string[];
}

/**
 * The trash state a note ends up with after an import. `local` is undefined when the note does
 * not exist yet, and then the backup's state is kept as is.
 *
 * For existing notes, a backup can bring a note back from the trash but never sends one there:
 * restoring a backup is about recovering notes, and silently hiding a note the user is still
 * working with would look like data loss.
 */
export function mergedDeletedAt(local: number | null | undefined, incoming: number | null): number | null {
  if (local === undefined) return incoming;
  return incoming === null ? null : local;
}

/**
 * Decides what happens to each incoming record, matched by uuid: new ones are inserted, and
 * existing ones are only overwritten when the incoming copy is strictly newer. Importing the
 * same backup twice is therefore a no-op, and an old backup never clobbers recent edits.
 */
export function planMerge(
  existingUpdatedAt: ReadonlyMap<string, number>,
  incoming: readonly { uuid: string; updatedAt: number }[]
): MergePlan {
  // A backup could list the same uuid twice; the newest copy is the one that counts.
  const newest = new Map<string, number>();
  for (const { uuid, updatedAt } of incoming) {
    newest.set(uuid, Math.max(updatedAt, newest.get(uuid) ?? -Infinity));
  }

  const plan: MergePlan = { insert: [], update: [], skip: [] };
  for (const [uuid, updatedAt] of newest) {
    const current = existingUpdatedAt.get(uuid);
    if (current === undefined) plan.insert.push(uuid);
    else if (updatedAt > current) plan.update.push(uuid);
    else plan.skip.push(uuid);
  }
  return plan;
}
