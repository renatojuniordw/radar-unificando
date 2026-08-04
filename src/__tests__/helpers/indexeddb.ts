import { close, DB_NAME } from '@/lib/infrastructure/storage/browser-storage';

export async function resetIndexedDB(): Promise<void> {
  await close();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

export function installLocalStorage(store: Record<string, string> = {}): Record<string, string> {
  (globalThis as any).window = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (_: number) => null,
  };
  return store;
}

export function removeBrowserGlobals(): void {
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
  delete (globalThis as any).indexedDB;
}