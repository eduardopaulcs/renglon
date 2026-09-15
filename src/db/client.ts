import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'renglon.db';

/**
 * enableChangeListener is required for useLiveQuery to react: without it, queries resolve
 * once and the note list never updates on its own after an insert. It is the most common
 * cause of "it saves but nothing shows up".
 */
export const sqliteDb = SQLite.openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: true,
});

// SQLite ships with foreign keys DISABLED on every connection, so the schema's onDelete rules
// would be decorative without this.
sqliteDb.execSync('PRAGMA foreign_keys = ON;');

// WAL noticeably improves read/write concurrency, which is exactly the pattern of an editor
// autosaving while the list keeps querying.
sqliteDb.execSync('PRAGMA journal_mode = WAL;');

export const db = drizzle(sqliteDb, { schema });

export type Database = typeof db;
