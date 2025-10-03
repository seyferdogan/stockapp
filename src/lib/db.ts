import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleTurso } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleTurso>;

if (process.env.NODE_ENV === 'production' && process.env.TURSO_DATABASE_URL) {
  // Production: Use Turso
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  db = drizzleTurso(client, { schema });
} else {
  // Development: Use local SQLite
  const sqlite = new Database('./local.db');
  db = drizzle(sqlite, { schema });
}

export { db };
