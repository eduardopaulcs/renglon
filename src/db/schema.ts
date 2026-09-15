import { sql, relations } from 'drizzle-orm';
import { type AnySQLiteColumn, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Renglon schema.
 *
 * Two decisions shape everything else:
 *
 * 1. The PK is an autoincrementing INTEGER, not the uuid. External-content FTS5 indexes by
 *    rowid, and a TEXT PK would leave the virtual table with no way to reference rows. The
 *    `uuid` still exists as a stable identity for export/import (and for a possible sync
 *    later on, without redesigning anything).
 *
 * 2. Dates are integers (epoch ms). SQLite has no date type; storing ISO strings would force
 *    lexicographic comparisons when sorting.
 */

const timestamps = {
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
};

export const folders = sqliteTable(
  'folders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    name: text('name').notNull(),
    // Self-reference: allows nested folders. onDelete cascade removes the whole subtree.
    parentId: integer('parent_id').references((): AnySQLiteColumn => folders.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [index('folders_parent_idx').on(table.parentId)]
);

export const notes = sqliteTable(
  'notes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    title: text('title').notNull().default(''),
    /** Raw Markdown. Rendering happens in the UI layer. */
    body: text('body').notNull().default(''),
    folderId: integer('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    /** Soft delete: the trash has to be undoable. NULL = live note. */
    deletedAt: integer('deleted_at'),
    ...timestamps,
  },
  (table) => [
    index('notes_folder_idx').on(table.folderId),
    // Composite index: the main screen filters by live/non-archived and sorts by updatedAt.
    // With this index that query does not scan the table.
    index('notes_active_updated_idx').on(table.deletedAt, table.archived, table.updatedAt),
  ]
);

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid').notNull().unique(),
  name: text('name').notNull().unique(),
  /** Optional hex (#RRGGBB); when NULL the UI derives a color from the name. */
  color: text('color'),
  ...timestamps,
});

export const noteTags = sqliteTable(
  'note_tags',
  {
    noteId: integer('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.noteId, table.tagId] }), index('note_tags_tag_idx').on(table.tagId)]
);

// --- Relations (typing only, for Drizzle's query API) ---------------------

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, { fields: [folders.parentId], references: [folders.id], relationName: 'folderTree' }),
  children: many(folders, { relationName: 'folderTree' }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  folder: one(folders, { fields: [notes.folderId], references: [folders.id] }),
  noteTags: many(noteTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  noteTags: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type Tag = typeof tags.$inferSelect;
