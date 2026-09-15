import { randomUUID } from 'expo-crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../client';
import { notes, type Note } from '../schema';
import { toFtsMatchExpression } from './fts';

const now = () => Date.now();

/**
 * Main screen query. It is not executed here: the query is returned so the screen can pass
 * it through useLiveQuery and re-render on its own whenever the table changes.
 */
export const activeNotesQuery = db
  .select()
  .from(notes)
  .where(and(isNull(notes.deletedAt), eq(notes.archived, false)))
  .orderBy(desc(notes.pinned), desc(notes.updatedAt));

export async function createNote(values: Partial<Pick<Note, 'title' | 'body' | 'folderId'>> = {}) {
  const [created] = await db
    .insert(notes)
    .values({
      uuid: randomUUID(),
      title: values.title ?? '',
      body: values.body ?? '',
      folderId: values.folderId ?? null,
      createdAt: now(),
      updatedAt: now(),
    })
    .returning();

  return created;
}

export async function getNote(id: number) {
  const [note] = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return note ?? null;
}

export async function updateNote(id: number, values: Partial<Pick<Note, 'title' | 'body' | 'pinned' | 'archived'>>) {
  await db
    .update(notes)
    .set({ ...values, updatedAt: now() })
    .where(eq(notes.id, id));
}

/** Soft delete: the note leaves the list but can be recovered. */
export async function trashNote(id: number) {
  await db.update(notes).set({ deletedAt: now(), updatedAt: now() }).where(eq(notes.id, id));
}

/**
 * Full-text search.
 *
 * Filtering by deleted_at happens here rather than in the triggers on purpose: keeping
 * trashed notes in the index avoids reindexing them when they are restored. The cost is
 * this extra WHERE.
 */
export async function searchNotes(term: string): Promise<Note[]> {
  const match = toFtsMatchExpression(term);
  if (!match) return [];

  const rows = await db.all<Note>(sql`
    SELECT n.* FROM ${notes} n
    JOIN notes_fts f ON f.rowid = n.id
    WHERE notes_fts MATCH ${match}
      AND n.deleted_at IS NULL
    ORDER BY rank
    LIMIT 100
  `);

  return rows;
}
