import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '../client';
import { folders, type Folder } from '../schema';

export function listFolders(): Folder[] {
  return db
    .select()
    .from(folders)
    .orderBy(sql`${folders.name} COLLATE NOCASE`)
    .all();
}

export function getFolder(id: number): Folder | null {
  return db.select().from(folders).where(eq(folders.id, id)).get() ?? null;
}

export function createFolder(name: string): Folder {
  const timestamp = Date.now();
  return db
    .insert(folders)
    .values({ uuid: randomUUID(), name: name.trim(), createdAt: timestamp, updatedAt: timestamp })
    .returning()
    .get();
}

export function renameFolder(id: number, name: string) {
  db.update(folders)
    .set({ name: name.trim(), updatedAt: Date.now() })
    .where(eq(folders.id, id))
    .run();
}

/** The notes inside are kept: the foreign key sets their folder_id to NULL. */
export function deleteFolder(id: number) {
  db.delete(folders).where(eq(folders.id, id)).run();
}
