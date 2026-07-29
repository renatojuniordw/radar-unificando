import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let client: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (db) return db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurada');

  client = postgres(url, { max: 10, idle_timeout: 30 });
  db = drizzle(client, { schema });

  return db;
}

export function closeDb() {
  if (client) {
    client.end();
    client = null;
    db = null;
  }
}

if (typeof process.on === 'function') {
  process.on('SIGTERM', () => closeDb());
  process.on('SIGINT', () => closeDb());
}
