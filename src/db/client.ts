import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'renglon.db';

/**
 * enableChangeListener es obligatorio para que useLiveQuery reaccione: sin el,
 * las consultas se resuelven una vez y la lista de notas nunca se actualiza
 * sola tras un insert. Es la causa mas comun de "guarda pero no se ve".
 */
export const sqliteDb = SQLite.openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: true,
});

// SQLite trae las foreign keys DESACTIVADAS por defecto en cada conexion, asi
// que los onDelete del esquema serian decorativos si no se activa esto.
sqliteDb.execSync('PRAGMA foreign_keys = ON;');

// WAL mejora notablemente la concurrencia lectura/escritura, que es justo el
// patron de un editor con autosave mientras la lista sigue consultando.
sqliteDb.execSync('PRAGMA journal_mode = WAL;');

export const db = drizzle(sqliteDb, { schema });

export type Database = typeof db;
