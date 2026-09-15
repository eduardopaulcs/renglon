import { randomUUID } from 'expo-crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../client';
import { notes, type Note } from '../schema';
import { toFtsMatchExpression } from './fts';

const now = () => Date.now();

/**
 * Consulta de la pantalla principal. No se ejecuta aca: se devuelve el query
 * para que la pantalla lo pase por useLiveQuery y se re-renderice sola cuando
 * cambie la tabla.
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

/** Borrado logico: la nota sale de la lista pero se puede recuperar. */
export async function trashNote(id: number) {
  await db.update(notes).set({ deletedAt: now(), updatedAt: now() }).where(eq(notes.id, id));
}

/**
 * Busqueda full-text.
 *
 * Se filtra por deleted_at aca y no en los triggers a proposito: mantener las
 * notas de la papelera dentro del indice evita tener que reindexar al
 * restaurarlas. El costo es este WHERE extra.
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
