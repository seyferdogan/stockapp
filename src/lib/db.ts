import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleTurso } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleTurso>;

// Check if Turso credentials are available (prioritize this)
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // Use Turso (remote database)
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  db = drizzleTurso(client, { schema });
  console.log('📦 Using Turso database');
} else {
  // Development: Use local SQLite
  const sqlite = new Database('./local.db');
  db = drizzle(sqlite, { schema });
  console.log('📦 Using local SQLite database');
}

export { db };
