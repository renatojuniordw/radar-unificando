import { describe, it, expect, vi } from 'vitest';
import { ResumeExtractionCache, hashContent } from '@/lib/core/parsing/resume-extraction-cache';

describe('hashContent', () => {
  it('should produce stable sha256 hashes', () => {
    expect(hashContent('olá mundo')).toBe(hashContent('olá mundo'));
    expect(hashContent('a')).not.toBe(hashContent('b'));
    expect(hashContent('a')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('ResumeExtractionCache', () => {
  it('should return null for unknown hash', () => {
    const cache = new ResumeExtractionCache();
    expect(cache.get('nope')).toBeNull();
  });

  it('should store and retrieve a result', () => {
    const cache = new ResumeExtractionCache();
    const result = {
      skills: ['Python', 'SQL'],
      experienceYears: 5,
      seniority: 'senior',
      education: ['Computer Science'],
      currentRole: 'Engenheiro de Dados',
      area: 'Dados',
    };
    const hash = hashContent('## Skills\nPython, SQL');
    cache.set(hash, result);
    expect(cache.get(hash)).toEqual(result);
  });

  it('should evict expired entries (TTL)', () => {
    const cache = new ResumeExtractionCache();
    const result = {
      skills: ['Python'],
      experienceYears: null,
      seniority: null,
      education: [],
      currentRole: null,
      area: null,
    };
    const hash = hashContent('texto');
    cache.set(hash, result);

    // Manipula o relógio interno via reflect para simular TTL expirado
    const entry = (cache as any).store.get(hash);
    entry.extractedAt = Date.now() - 2 * 60 * 60 * 1000; // 2h atrás

    expect(cache.get(hash)).toBeNull();
  });

  it('should evict the oldest entry when at capacity', () => {
    const cache = new ResumeExtractionCache();
    const result = {
      skills: ['Python'],
      experienceYears: null,
      seniority: null,
      education: [],
      currentRole: null,
      area: null,
    };

    // Enche o cache além do limite (MAX_ENTRIES = 200)
    for (let i = 0; i < 210; i++) {
      cache.set(`hash-${i}`, result);
    }

    expect((cache as any).store.size).toBeLessThanOrEqual(200);
    // A mais antiga foi removida
    expect(cache.get('hash-0')).toBeNull();
    // As mais recentes continuam
    expect(cache.get('hash-209')).toEqual(result);
  });

  it('should purge expired entries on the cleanup interval', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T00:00:00Z'));
    const cache = new ResumeExtractionCache();
    const result = {
      skills: ['Python'],
      experienceYears: null,
      seniority: null,
      education: [],
      currentRole: null,
      area: null,
    };
    cache.set('hash-a', result);
    cache.set('hash-b', result);

    vi.setSystemTime(new Date('2026-08-01T02:00:00Z'));
    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(cache.get('hash-a')).toBeNull();
    expect(cache.get('hash-b')).toBeNull();
    vi.useRealTimers();
  });
});
