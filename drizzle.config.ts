import type { Config } from 'drizzle-kit';

/**
 * driver: 'expo' makes drizzle-kit emit migrations that Metro can bundle
 * (drizzle/migrations.js) instead of trying to connect to a real database.
 */
export default {
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema.ts',
  out: './drizzle',
} satisfies Config;
