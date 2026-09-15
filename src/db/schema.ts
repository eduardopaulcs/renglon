import { sql, relations } from 'drizzle-orm';
import { type AnySQLiteColumn, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Esquema de Renglon.
 *
 * Dos decisiones que condicionan todo lo demas:
 *
 * 1. La PK es un INTEGER autoincremental, no el uuid. FTS5 con contenido
 *    externo indexa por rowid, y un TEXT como PK deja la tabla virtual sin
 *    forma de referenciar las filas. El `uuid` existe igual, como identidad
 *    estable para export/import (y para un eventual sync sin rediseñar nada).
 *
 * 2. Las fechas son enteros (epoch ms). SQLite no tiene tipo fecha; guardar
 *    ISO strings obligaria a comparar lexicograficamente al ordenar.
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
    // Autorreferencia: permite carpetas anidadas. onDelete cascade borra el subarbol.
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
    /** Markdown en crudo. El renderizado se hace en la capa de UI. */
    body: text('body').notNull().default(''),
    folderId: integer('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    /** Borrado logico: la papelera necesita poder deshacer. NULL = nota viva. */
    deletedAt: integer('deleted_at'),
    ...timestamps,
  },
  (table) => [
    index('notes_folder_idx').on(table.folderId),
    // Indice compuesto: la pantalla principal filtra por vivas/no archivadas y
    // ordena por updatedAt. Con este indice esa consulta no escanea la tabla.
    index('notes_active_updated_idx').on(table.deletedAt, table.archived, table.updatedAt),
  ]
);

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid').notNull().unique(),
  name: text('name').notNull().unique(),
  /** Hex opcional (#RRGGBB); si es NULL la UI asigna un color derivado del nombre. */
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

// --- Relaciones (solo tipado para la query API de Drizzle) ----------------

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
