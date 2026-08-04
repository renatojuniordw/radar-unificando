import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { JobData } from '@/types';

export const DB_NAME = 'radar-unificando';
const DB_VERSION = 1;
const STORE = 'kv';

const KEYS = {
  VAGAS: 'anon_vagas',
  COOLDOWN_END: 'cooldown_end',
  FILTERS: 'filters',
  CHAT_ID: 'chat_id',
  CHAT_MESSAGES: 'chat_messages',
  MIGRATED: 'migrated_v1',
} as const;

// Chaves legadas do localStorage (backfill único)
const LEGACY_KEYS = {
  VAGAS: 'ru_anon_vagas',
  COOLDOWN_END: 'ru_cooldown_end',
} as const;

const DATA_KEYS = [
  KEYS.VAGAS,
  KEYS.COOLDOWN_END,
  KEYS.FILTERS,
  KEYS.CHAT_ID,
  KEYS.CHAT_MESSAGES,
] as const;

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
    if (vagas) await db.put(STORE, JSON.parse(vagas), KEYS.VAGAS);
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
      upgrade(db) {
        db.createObjectStore(STORE);
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
  getVagas: () => getValue<JobData[]>(KEYS.VAGAS, []),
  setVagas: (vagas: JobData[]) => setValue(KEYS.VAGAS, vagas),

  getCooldownEnd: () => getValue<number | null>(KEYS.COOLDOWN_END, null),
  setCooldownEnd: (endsAt: number) => setValue(KEYS.COOLDOWN_END, endsAt),
  clearCooldown: () => del(KEYS.COOLDOWN_END),

  getFilters: () =>
    getValue<{ empresas: string[]; cargos: string[] } | null>(KEYS.FILTERS, null),
  setFilters: (filters: { empresas: string[]; cargos: string[] }) =>
    setValue(KEYS.FILTERS, filters),

  getChatId: () => getValue<string | null>(KEYS.CHAT_ID, null),
  setChatId: (id: string) => setValue(KEYS.CHAT_ID, id),

  getChatMessages: () => getValue<any[]>(KEYS.CHAT_MESSAGES, []),
  setChatMessages: (messages: any[]) => setValue(KEYS.CHAT_MESSAGES, messages),

  // Limpa os dados anônimos (vagas + cooldown), preservando filtros e chat
  clear: async (): Promise<void> => {
    try {
      const db = await getDB();
      if (!db) return;
      await Promise.all([
        db.delete(STORE, KEYS.VAGAS),
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