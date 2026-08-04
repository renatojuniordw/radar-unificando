import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Job } from '@/lib/types/job';

interface StoredChatMessage {
  role?: string;
  content?: string;
  parts?: { type: string; text?: string }[];
}

export const DB_NAME = 'radar-unificando';
// v2: o payload de /api/vagas passou a usar chaves em inglês (rename PT->EN),
// então o cache antigo salvo sob KEYS.JOBS (formato PT) é descartado no upgrade.
const DB_VERSION = 2;
const STORE = 'kv';

const KEYS = {
  JOBS: 'anon_vagas',
  COOLDOWN_END: 'cooldown_end',
  LAST_RUN_AT: 'last_run_at',
  FILTERS: 'filters',
  CHAT_ID: 'chat_id',
  CHAT_MESSAGES: 'chat_messages',
  MIGRATED: 'migrated_v1',
} as const;

// Chaves legadas do localStorage (backfill único) — não mudam de valor,
// usadas para migrar dados de usuários anônimos existentes.
const LEGACY_KEYS = {
  VAGAS: 'ru_anon_vagas',
  COOLDOWN_END: 'ru_cooldown_end',
} as const;

interface Schema extends DBSchema {
  kv: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

function readLegacy(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

async function ensureMigration(db: IDBPDatabase<Schema>): Promise<void> {
  try {
    if (await db.get(STORE, KEYS.MIGRATED)) return;
    const vagas = readLegacy(LEGACY_KEYS.VAGAS);
    const cooldown = readLegacy(LEGACY_KEYS.COOLDOWN_END);
    if (vagas) await db.put(STORE, JSON.parse(vagas), KEYS.JOBS);
    if (cooldown) await db.put(STORE, Number(cooldown), KEYS.COOLDOWN_END);
    await db.put(STORE, true, KEYS.MIGRATED);
  } catch {
    /* migração é best-effort */
  }
}

async function getDB(): Promise<IDBPDatabase<Schema> | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE);
        }
        if (oldVersion >= 1 && oldVersion < 2) {
          // Payload de /api/vagas mudou de formato (PT->EN) — invalida o cache antigo.
          void transaction.objectStore(STORE).delete(KEYS.JOBS);
        }
      },
    });
  }
  try {
    const db = await dbPromise;
    await ensureMigration(db);
    return db;
  } catch {
    return null;
  }
}

async function getValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await getDB();
    if (!db) return fallback;
    const value = await db.get(STORE, key);
    return value === undefined ? fallback : (value as T);
  } catch {
    return fallback;
  }
}

async function setValue(key: string, value: unknown): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.put(STORE, value, key);
  } catch {
    /* IndexedDB indisponível */
  }
}

async function del(key: string): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.delete(STORE, key);
  } catch {
    /* IndexedDB indisponível */
  }
}

export const browserStorage = {
  getJobs: () => getValue<Job[]>(KEYS.JOBS, []),
  setJobs: (jobs: Job[]) => setValue(KEYS.JOBS, jobs),

  getCooldownEnd: () => getValue<number | null>(KEYS.COOLDOWN_END, null),
  setCooldownEnd: (endsAt: number) => setValue(KEYS.COOLDOWN_END, endsAt),
  clearCooldown: () => del(KEYS.COOLDOWN_END),

  getLastRunAt: () => getValue<number | null>(KEYS.LAST_RUN_AT, null),
  setLastRunAt: (timestamp: number) => setValue(KEYS.LAST_RUN_AT, timestamp),

  getFilters: () =>
    getValue<{ companies: string[]; roles: string[] } | null>(KEYS.FILTERS, null),
  setFilters: (filters: { companies: string[]; roles: string[] }) =>
    setValue(KEYS.FILTERS, filters),

  getChatId: () => getValue<string | null>(KEYS.CHAT_ID, null),
  setChatId: (id: string) => setValue(KEYS.CHAT_ID, id),

  getChatMessages: () => getValue<StoredChatMessage[]>(KEYS.CHAT_MESSAGES, []),
  setChatMessages: (messages: StoredChatMessage[]) => setValue(KEYS.CHAT_MESSAGES, messages),

  // Limpa os dados anônimos (vagas + cooldown), preservando filtros e chat
  clear: async (): Promise<void> => {
    try {
      const db = await getDB();
      if (!db) return;
      await Promise.all([
        db.delete(STORE, KEYS.JOBS),
        db.delete(STORE, KEYS.COOLDOWN_END),
      ]);
    } catch {
      /* IndexedDB indisponível */
    }
  },
};

export async function close(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise.catch(() => null);
    db?.close();
    dbPromise = null;
  }
}
