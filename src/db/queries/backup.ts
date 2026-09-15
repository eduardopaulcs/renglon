import { eq, inArray, isNull, sql } from 'drizzle-orm';

import { BACKUP_APP, BACKUP_VERSION, mergedDeletedAt, planMerge, type Backup } from '@/lib/backup-format';

import { db } from '../client';
import { folders, noteTags, notes, tags } from '../schema';

export function exportBackup(): Backup {
  const folderRows = db.select().from(folders).all();
  const tagRows = db.select().from(tags).all();
  // The trash stays out: a backup holds the notes worth keeping, and restoring it must not
  // bring back notes that were deleted on purpose.
  const noteRows = db.select().from(notes).where(isNull(notes.deletedAt)).all();
  const links = db.select().from(noteTags).all();

  const folderUuid = new Map(folderRows.map((f) => [f.id, f.uuid]));
  const tagUuid = new Map(tagRows.map((t) => [t.id, t.uuid]));
  const tagsByNote = new Map<number, string[]>();
  for (const link of links) {
    const uuid = tagUuid.get(link.tagId);
    if (!uuid) continue;
    tagsByNote.set(link.noteId, [...(tagsByNote.get(link.noteId) ?? []), uuid]);
  }

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    folders: folderRows.map((f) => ({
      uuid: f.uuid,
      name: f.name,
      parentUuid: f.parentId === null ? null : (folderUuid.get(f.parentId) ?? null),
      icon: f.icon,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })),
    tags: tagRows.map((t) => ({
      uuid: t.uuid,
      name: t.name,
      color: t.color,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    notes: noteRows.map((n) => ({
      uuid: n.uuid,
      title: n.title,
      body: n.body,
      folderUuid: n.folderId === null ? null : (folderUuid.get(n.folderId) ?? null),
      tagUuids: tagsByNote.get(n.id) ?? [],
      pinned: n.pinned,
      archived: n.archived,
      deletedAt: n.deletedAt,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
  };
}

/**
 * Merges a backup into the database in a single transaction: either the whole file is applied
 * or nothing is. Records are matched by uuid and only overwritten by newer copies (see
 * planMerge). A tag whose name already exists under another uuid is merged into the local one
 * instead of failing on the unique name.
 */
export function importBackup(backup: Backup): { created: number; updated: number } {
  return db.transaction((tx) => {
    // --- Folders ---
    const existingFolders = tx.select().from(folders).all();
    const folderPlan = planMerge(new Map(existingFolders.map((f) => [f.uuid, f.updatedAt])), backup.folders);
    const incomingFolders = new Map(backup.folders.map((f) => [f.uuid, f]));

    for (const uuid of folderPlan.insert) {
      const f = incomingFolders.get(uuid)!;
      tx.insert(folders)
        .values({ uuid, name: f.name, icon: f.icon, createdAt: f.createdAt, updatedAt: f.updatedAt })
        .run();
    }
    for (const uuid of folderPlan.update) {
      const f = incomingFolders.get(uuid)!;
      tx.update(folders).set({ name: f.name, icon: f.icon, updatedAt: f.updatedAt }).where(eq(folders.uuid, uuid)).run();
    }

    const folderId = new Map(tx.select({ id: folders.id, uuid: folders.uuid }).from(folders).all().map((f) => [f.uuid, f.id]));
    // Parents are linked in a second pass because a child can appear before its parent.
    for (const uuid of [...folderPlan.insert, ...folderPlan.update]) {
      const parentUuid = incomingFolders.get(uuid)!.parentUuid;
      const parentId = parentUuid ? (folderId.get(parentUuid) ?? null) : null;
      tx.update(folders).set({ parentId }).where(eq(folders.uuid, uuid)).run();
    }

    // --- Tags ---
    const existingTags = tx.select().from(tags).all();
    const tagPlan = planMerge(new Map(existingTags.map((t) => [t.uuid, t.updatedAt])), backup.tags);
    const incomingTags = new Map(backup.tags.map((t) => [t.uuid, t]));
    const tagId = new Map(existingTags.map((t) => [t.uuid, t.id]));
    const nameTaken = (name: string, exceptUuid?: string) =>
      tx
        .select({ id: tags.id, uuid: tags.uuid })
        .from(tags)
        .where(sql`lower(${tags.name}) = lower(${name})`)
        .all()
        .find((row) => row.uuid !== exceptUuid);

    for (const uuid of tagPlan.insert) {
      const t = incomingTags.get(uuid)!;
      const clash = nameTaken(t.name);
      if (clash) {
        tagId.set(uuid, clash.id);
        continue;
      }
      const created = tx
        .insert(tags)
        .values({ uuid, name: t.name, color: t.color, createdAt: t.createdAt, updatedAt: t.updatedAt })
        .returning({ id: tags.id })
        .get();
      tagId.set(uuid, created.id);
    }
    for (const uuid of tagPlan.update) {
      const t = incomingTags.get(uuid)!;
      const name = nameTaken(t.name, uuid) ? undefined : t.name;
      tx.update(tags)
        .set({ ...(name ? { name } : {}), color: t.color, updatedAt: t.updatedAt })
        .where(eq(tags.uuid, uuid))
        .run();
    }

    // --- Notes ---
    const existingNotes = tx
      .select({ uuid: notes.uuid, updatedAt: notes.updatedAt, deletedAt: notes.deletedAt })
      .from(notes)
      .all();
    const notePlan = planMerge(new Map(existingNotes.map((n) => [n.uuid, n.updatedAt])), backup.notes);
    const localDeletedAt = new Map(existingNotes.map((n) => [n.uuid, n.deletedAt]));
    const incomingNotes = new Map(backup.notes.map((n) => [n.uuid, n]));

    const values = (uuid: string) => {
      const n = incomingNotes.get(uuid)!;
      return {
        title: n.title,
        body: n.body,
        folderId: n.folderUuid ? (folderId.get(n.folderUuid) ?? null) : null,
        pinned: n.pinned,
        archived: n.archived,
        deletedAt: mergedDeletedAt(localDeletedAt.get(uuid), n.deletedAt),
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      };
    };

    for (const uuid of notePlan.insert) {
      tx.insert(notes).values({ uuid, ...values(uuid) }).run();
    }
    for (const uuid of notePlan.update) {
      tx.update(notes).set(values(uuid)).where(eq(notes.uuid, uuid)).run();
    }

    // Trashing a note does not change updatedAt, so the backup copy of a trashed note usually is
    // not newer and gets skipped. Its trash state is merged anyway, or importing a backup could
    // never bring such a note back.
    const restored = notePlan.skip.filter(
      (uuid) => localDeletedAt.get(uuid) !== null && incomingNotes.get(uuid)!.deletedAt === null
    );
    if (restored.length) {
      tx.update(notes).set({ deletedAt: null }).where(inArray(notes.uuid, restored)).run();
    }

    const touched = [...notePlan.insert, ...notePlan.update];
    if (touched.length) {
      const noteId = new Map(
        tx.select({ id: notes.id, uuid: notes.uuid }).from(notes).where(inArray(notes.uuid, touched)).all().map((n) => [n.uuid, n.id])
      );
      for (const uuid of touched) {
        const id = noteId.get(uuid)!;
        tx.delete(noteTags).where(eq(noteTags.noteId, id)).run();
        const ids = [...new Set(incomingNotes.get(uuid)!.tagUuids.map((t) => tagId.get(t)).filter((v): v is number => v !== undefined))];
        if (ids.length) {
          tx.insert(noteTags).values(ids.map((tag) => ({ noteId: id, tagId: tag }))).run();
        }
      }
    }

    return { created: notePlan.insert.length, updated: notePlan.update.length + restored.length };
  });
}
