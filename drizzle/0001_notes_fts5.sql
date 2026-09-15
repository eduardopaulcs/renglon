-- Full-text search over notes.
--
-- Hand-written because Drizzle does not model virtual tables: if the schema is regenerated,
-- this file survives but is NOT updated. Any change to the title/body columns of `notes`
-- means revisiting the triggers below.
--
-- content='notes' declares an external-content table: the index does not duplicate the text,
-- it only stores the terms and points at the rowid in `notes`. In exchange, SQLite keeps
-- nothing in sync on its own, so the triggers are mandatory.
--
-- remove_diacritics 2 makes "cancion" match both "cancion" and "canción".

CREATE VIRTUAL TABLE `notes_fts` USING fts5(
	title,
	body,
	content='notes',
	content_rowid='id',
	tokenize='unicode61 remove_diacritics 2'
);
--> statement-breakpoint

CREATE TRIGGER `notes_fts_insert` AFTER INSERT ON `notes` BEGIN
	INSERT INTO `notes_fts`(`rowid`, `title`, `body`) VALUES (new.`id`, new.`title`, new.`body`);
END;
--> statement-breakpoint

-- External-content tables are not deleted from with DELETE: the 'delete' command row has to
-- be inserted with the OLD values. If they do not exactly match what was indexed, the index
-- gets corrupted and searches return garbage.
CREATE TRIGGER `notes_fts_delete` AFTER DELETE ON `notes` BEGIN
	INSERT INTO `notes_fts`(`notes_fts`, `rowid`, `title`, `body`)
	VALUES ('delete', old.`id`, old.`title`, old.`body`);
END;
--> statement-breakpoint

CREATE TRIGGER `notes_fts_update` AFTER UPDATE ON `notes` BEGIN
	INSERT INTO `notes_fts`(`notes_fts`, `rowid`, `title`, `body`)
	VALUES ('delete', old.`id`, old.`title`, old.`body`);
	INSERT INTO `notes_fts`(`rowid`, `title`, `body`) VALUES (new.`id`, new.`title`, new.`body`);
END;
--> statement-breakpoint

-- Populates the index from existing rows. On a fresh database it does nothing; it matters
-- when this migration runs on top of an earlier install.
INSERT INTO `notes_fts`(`notes_fts`) VALUES ('rebuild');
