import { and, eq, ne, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '../client';
import { tags, type Tag } from '../schema';

export class TagNameTakenError extends Error {
  constructor(name: string) {
    super(`A tag named "${name}" already exists`);
    this.name = 'TagNameTakenError';
  }
}

// The unique index on tags.name is case-sensitive, but "Work" and "work" as two different tags
// would only confuse, so uniqueness is enforced here case-insensitively.
const sameName = (name: string) => sql`lower(${tags.name}) = lower(${name.trim()})`;

export function listTags(): Tag[] {
  return db
    .select()
    .from(tags)
    .orderBy(sql`${tags.name} COLLATE NOCASE`)
    .all();
}

export function getTag(id: number): Tag | null {
  return db.select().from(tags).where(eq(tags.id, id)).get() ?? null;
}

/** Returns the existing tag when the name is already taken, so typing it again just reuses it. */
export function createTag(name: string, color: string | null = null): Tag {
  const existing = db.select().from(tags).where(sameName(name)).get();
  if (existing) return existing;

  const timestamp = Date.now();
  return db
    .insert(tags)
    .values({ uuid: randomUUID(), name: name.trim(), color, createdAt: timestamp, updatedAt: timestamp })
    .returning()
    .get();
}

export function updateTag(id: number, changes: { name: string; color: string | null }) {
  const clash = db
    .select()
    .from(tags)
    .where(and(sameName(changes.name), ne(tags.id, id)))
    .get();
  if (clash) throw new TagNameTakenError(changes.name);

  db.update(tags)
    .set({ name: changes.name.trim(), color: changes.color, updatedAt: Date.now() })
    .where(eq(tags.id, id))
    .run();
}

/** Removes the tag from every note through the note_tags cascade; the notes stay. */
export function deleteTag(id: number) {
  db.delete(tags).where(eq(tags.id, id)).run();
}
