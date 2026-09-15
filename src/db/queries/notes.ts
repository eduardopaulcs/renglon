import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '../client';
import { folders, noteTags, notes, tags, type Folder, type Note, type Tag } from '../schema';
import { toFtsMatchExpression } from './fts';

export type NoteListItem = Note & { tags: Tag[]; folder: Folder | null };

export interface NoteFilter {
  folderId?: number;
  tagId?: number;
  trashed?: boolean;
  /** Restricts the list to these ids and keeps their order, which is the search ranking. */
  ids?: number[];
}

const now = () => Date.now();

function attachMeta(rows: Note[]): NoteListItem[] {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const tagRows = db
    .select({ noteId: noteTags.noteId, tag: tags })
    .from(noteTags)
    .innerJoin(tags, eq(tags.id, noteTags.tagId))
    .where(inArray(noteTags.noteId, ids))
    .orderBy(asc(tags.name))
    .all();

  const tagsByNote = new Map<number, Tag[]>();
  for (const { noteId, tag } of tagRows) {
    const list = tagsByNote.get(noteId) ?? [];
    list.push(tag);
    tagsByNote.set(noteId, list);
  }

  const folderIds = [...new Set(rows.map((row) => row.folderId).filter((id): id is number => id !== null))];
  const folderById = new Map(
    (folderIds.length ? db.select().from(folders).where(inArray(folders.id, folderIds)).all() : []).map(
      (folder) => [folder.id, folder]
    )
  );

  return rows.map((note) => ({
    ...note,
    tags: tagsByNote.get(note.id) ?? [],
    folder: note.folderId === null ? null : (folderById.get(note.folderId) ?? null),
  }));
}

export function listNotes(filter: NoteFilter = {}): NoteListItem[] {
  if (filter.ids?.length === 0) return [];

  const conditions: SQL[] = [filter.trashed ? isNotNull(notes.deletedAt) : isNull(notes.deletedAt)];
  if (!filter.trashed) conditions.push(eq(notes.archived, false));
  if (filter.folderId !== undefined) conditions.push(eq(notes.folderId, filter.folderId));
  if (filter.tagId !== undefined) {
    conditions.push(
      inArray(notes.id, db.select({ id: noteTags.noteId }).from(noteTags).where(eq(noteTags.tagId, filter.tagId)))
    );
  }
  if (filter.ids) conditions.push(inArray(notes.id, filter.ids));

  const order = filter.trashed ? [desc(notes.deletedAt)] : [desc(notes.pinned), desc(notes.updatedAt)];
  const rows = db
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(...order)
    .all();

  if (filter.ids) {
    const rank = new Map(filter.ids.map((id, index) => [id, index]));
    rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  }
  return attachMeta(rows);
}

/**
 * Full-text search, ranked by relevance.
 *
 * Filtering by deleted_at happens here rather than in the triggers on purpose: keeping trashed
 * notes in the index avoids reindexing them when they are restored. The cost is this extra
 * WHERE.
 */
export function searchNoteIds(term: string): number[] {
  const match = toFtsMatchExpression(term);
  if (!match) return [];

  return db
    .all<{ id: number }>(
      sql`
        SELECT n.id AS id FROM ${notes} n
        JOIN notes_fts f ON f.rowid = n.id
        WHERE notes_fts MATCH ${match}
          AND n.deleted_at IS NULL
        ORDER BY rank
        LIMIT 200
      `
    )
    .map((row) => row.id);
}

export function getNoteItem(id: number): NoteListItem | null {
  const row = db.select().from(notes).where(eq(notes.id, id)).get();
  return row ? attachMeta([row])[0] : null;
}

export function createNote(values: { folderId?: number | null; tagIds?: number[] } = {}): Note {
  return db.transaction((tx) => {
    const timestamp = now();
    const created = tx
      .insert(notes)
      .values({ uuid: randomUUID(), folderId: values.folderId ?? null, createdAt: timestamp, updatedAt: timestamp })
      .returning()
      .get();

    if (values.tagIds?.length) {
      tx.insert(noteTags)
        .values(values.tagIds.map((tagId) => ({ noteId: created.id, tagId })))
        .run();
    }
    return created;
  });
}

/** Only content edits move `updatedAt`, so organizing a note does not reorder the list. */
export function updateNoteContent(id: number, content: { title: string; body: string }) {
  db.update(notes)
    .set({ ...content, updatedAt: now() })
    .where(eq(notes.id, id))
    .run();
}

export function setNotePinned(id: number, pinned: boolean) {
  db.update(notes).set({ pinned }).where(eq(notes.id, id)).run();
}

export function setNoteFolder(id: number, folderId: number | null) {
  db.update(notes).set({ folderId }).where(eq(notes.id, id)).run();
}

export function setNoteTags(id: number, tagIds: number[]) {
  db.transaction((tx) => {
    tx.delete(noteTags).where(eq(noteTags.noteId, id)).run();
    if (tagIds.length) {
      tx.insert(noteTags)
        .values(tagIds.map((tagId) => ({ noteId: id, tagId })))
        .run();
    }
  });
}

/** Soft delete: the notes leave every list but stay recoverable from the trash. */
export function trashNotes(ids: number[]) {
  if (ids.length === 0) return;
  db.update(notes).set({ deletedAt: now() }).where(inArray(notes.id, ids)).run();
}

export function restoreNotes(ids: number[]) {
  if (ids.length === 0) return;
  db.update(notes).set({ deletedAt: null }).where(inArray(notes.id, ids)).run();
}

/** The only hard deletes of notes: from the trash, and discarding a note left empty. */
export function deleteNotesForever(ids: number[]) {
  if (ids.length === 0) return;
  db.delete(notes).where(inArray(notes.id, ids)).run();
}

export function emptyTrash() {
  db.delete(notes).where(isNotNull(notes.deletedAt)).run();
}

export interface NoteCounts {
  all: number;
  trash: number;
  byFolder: Map<number, number>;
  byTag: Map<number, number>;
}

export function noteCounts(): NoteCounts {
  const live = and(isNull(notes.deletedAt), eq(notes.archived, false));

  const all = db.select({ value: count() }).from(notes).where(live).get()?.value ?? 0;
  const trash = db.select({ value: count() }).from(notes).where(isNotNull(notes.deletedAt)).get()?.value ?? 0;

  const byFolder = new Map(
    db
      .select({ folderId: notes.folderId, value: count() })
      .from(notes)
      .where(and(live, isNotNull(notes.folderId)))
      .groupBy(notes.folderId)
      .all()
      .map((row) => [row.folderId as number, row.value])
  );

  const byTag = new Map(
    db
      .select({ tagId: noteTags.tagId, value: count() })
      .from(noteTags)
      .innerJoin(notes, eq(notes.id, noteTags.noteId))
      .where(live)
      .groupBy(noteTags.tagId)
      .all()
      .map((row) => [row.tagId, row.value])
  );

  return { all, trash, byFolder, byTag };
}
