-- Busqueda full-text sobre las notas.
--
-- Escrito a mano porque Drizzle no modela tablas virtuales: si se regenera el
-- esquema, este archivo sobrevive pero NO se actualiza solo. Cualquier cambio
-- en las columnas title/body de `notes` obliga a revisar los triggers de abajo.
--
-- content='notes' declara una tabla de contenido externo: el indice no duplica
-- el texto, solo guarda los terminos y apunta al rowid de `notes`. A cambio,
-- SQLite no sincroniza nada por su cuenta y los triggers son obligatorios.
--
-- remove_diacritics 2 hace que "cancion" encuentre "cancion" y "canción".

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

-- En tablas de contenido externo no se borra con DELETE: hay que insertar la
-- fila-comando 'delete' con los valores VIEJOS. Si no coinciden exactamente con
-- lo indexado, el indice queda corrupto y las busquedas devuelven basura.
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

-- Puebla el indice desde las filas ya existentes. En una base nueva no hace
-- nada; importa cuando esta migracion corre sobre una instalacion previa.
INSERT INTO `notes_fts`(`notes_fts`) VALUES ('rebuild');
