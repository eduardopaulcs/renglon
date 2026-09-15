import type { Config } from 'drizzle-kit';

/**
 * driver: 'expo' hace que drizzle-kit emita migraciones empaquetables por Metro
 * (drizzle/migrations.js) en vez de intentar conectarse a una base real.
 */
export default {
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema.ts',
  out: './drizzle',
} satisfies Config;
