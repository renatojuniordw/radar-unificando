import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { browserStorage } from '@/lib/infrastructure/storage/browser-storage';
import {
  resetIndexedDB,
  installLocalStorage,
} from '@/__tests__/helpers/indexeddb';

function installWindow() {
  (globalThis as any).window = {};
}

describe('browserStorage', () => {
  beforeEach(async () => {
    installWindow();
    await resetIndexedDB();
  });

  // ── SSR / indisponibilidade ──

  it('should_return_defaults_when_window_is_undefined', async () => {
    delete (globalThis as any).window;
    expect(await browserStorage.getJobs()).toEqual([]);
    expect(await browserStorage.getCooldownEnd()).toBeNull();
    expect(await browserStorage.getFilters()).toBeNull();
    expect(await browserStorage.getChatId()).toBeNull();
    expect(await browserStorage.getChatMessages()).toEqual([]);
    await expect(browserStorage.setJobs([{ company: 'A' } as any])).resolves.toBeUndefined();
  });

  // ── Vagas ──

  it('should_store_and_retrieve_vagas', async () => {
    const jobs = [{ company: 'CorpA', link: 'https://a.com' }] as any;
    await browserStorage.setJobs(jobs);
    expect(await browserStorage.getJobs()).toEqual(jobs);
  });

  it('should_return_empty_array_when_no_vagas', async () => {
    expect(await browserStorage.getJobs()).toEqual([]);
  });

  // ── Cooldown ──

  it('should_store_and_clear_cooldown', async () => {
    await browserStorage.setCooldownEnd(1234567890);
    expect(await browserStorage.getCooldownEnd()).toBe(1234567890);
    await browserStorage.clearCooldown();
    expect(await browserStorage.getCooldownEnd()).toBeNull();
  });

  // ── LastRunAt ──

  it('should_store_and_retrieve_last_run_at', async () => {
    const timestamp = Date.now();
    expect(await browserStorage.getLastRunAt()).toBeNull();
    await browserStorage.setLastRunAt(timestamp);
    expect(await browserStorage.getLastRunAt()).toBe(timestamp);
  });

  // ── Filtros ──

  it('should_store_and_retrieve_filters', async () => {
    const filters = { companies: ['CorpA'], roles: ['Analista'] };
    await browserStorage.setFilters(filters);
    expect(await browserStorage.getFilters()).toEqual(filters);
  });

  // ── Chat ──

  it('should_store_and_retrieve_chat_id', async () => {
    await browserStorage.setChatId('chat-123');
    expect(await browserStorage.getChatId()).toBe('chat-123');
  });

  it('should_store_and_retrieve_chat_messages', async () => {
    const messages = [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'oi' }] }];
    await browserStorage.setChatMessages(messages);
    expect(await browserStorage.getChatMessages()).toEqual(messages);
  });

  // ── Clear ──

  it('should_clear_only_anonymous_data', async () => {
    await browserStorage.setJobs([{ company: 'A' } as any]);
    await browserStorage.setCooldownEnd(123);
    await browserStorage.setFilters({ companies: ['X'], roles: ['Y'] });
    await browserStorage.setChatId('chat-1');

    await browserStorage.clear();

    expect(await browserStorage.getJobs()).toEqual([]);
    expect(await browserStorage.getCooldownEnd()).toBeNull();
    expect(await browserStorage.getFilters()).toEqual({ companies: ['X'], roles: ['Y'] });
    expect(await browserStorage.getChatId()).toBe('chat-1');
  });

  // ── Migração legada ──

  it('should_migrate_legacy_localstorage_keys', async () => {
    installLocalStorage({
      ru_anon_vagas: JSON.stringify([{ company: 'A', link: 'https://a' }]),
      ru_cooldown_end: '1234567890',
    });

    expect(await browserStorage.getJobs()).toEqual([{ company: 'A', link: 'https://a' }]);
    expect(await browserStorage.getCooldownEnd()).toBe(1234567890);
  });
});