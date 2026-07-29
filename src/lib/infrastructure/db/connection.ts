import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;
let dbPath: string | null = null;

export function initDb(dbFile?: string): Database.Database {
  if (db) return db;

  const resolvedPath = dbFile || process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'radar.db');
  dbPath = resolvedPath;

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  process.on('SIGTERM', () => closeDb());
  process.on('SIGINT', () => closeDb());

  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function isDbConnected(): boolean {
  if (!db) return false;
  try {
    db.prepare('SELECT 1').get();
    return true;
  } catch {
    return false;
  }
}
