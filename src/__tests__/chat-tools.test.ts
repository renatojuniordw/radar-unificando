import { describe, it, expect, vi, beforeEach } from 'vitest';

const searchJobsMock = vi.fn();
const filterAliveMock = vi.fn();

vi.mock('@/lib/core/mcp/gupy-client', () => ({
  gupyMcpClient: { searchJobs: (...args: unknown[]) => searchJobsMock(...args) },
}));

vi.mock('@/lib/core/pipeline/job-link-filter', () => ({
  jobLinkFilter: { filterAlive: (...args: unknown[]) => filterAliveMock(...args) },
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn() },
}));

vi.mock('@/lib/ats/ats-service', () => ({
  analyzeAtsWithCache: vi.fn(),
}));

import { createChatTools } from '@/lib/core/ai/chat-tools';

const gupyJobs = [
  { title: 'Dev 1', company: 'A', type: 'remoto', location: 'SP', link: 'https://gupy.io/1', postedAt: '2026-08-01', description: 'd' },
  { title: 'Dev 2', company: 'B', type: 'hibrido', location: 'RJ', link: 'https://gupy.io/2', postedAt: null, description: null },
];

describe('createChatTools.search_jobs', () => {
  beforeEach(() => {
    searchJobsMock.mockReset();
    filterAliveMock.mockReset();
  });

  it('should_filter_dead_links_and_format_alive_jobs', async () => {
    searchJobsMock.mockResolvedValue(gupyJobs);
    // Simula 1 link morto (vaga 2 removida)
    filterAliveMock.mockImplementation(async (jobs: { link: string }[]) =>
      jobs.filter((j) => j.link !== 'https://gupy.io/2'),
    );

    const tools = createChatTools('user-1');
    const result = await (tools.search_jobs as unknown as { execute: (args: { query: string }) => Promise<unknown> }).execute({ query: 'Dev' });

    expect(searchJobsMock).toHaveBeenCalledWith('Dev', 20); // limit*2
    expect(result).toEqual([
      expect.objectContaining({ titulo: 'Dev 1', link: 'https://gupy.io/1' }),
    ]);
    expect(result).not.toEqual(expect.arrayContaining([expect.objectContaining({ titulo: 'Dev 2' })]));
  });

  it('should_return_error_after_2_searches', async () => {
    searchJobsMock.mockResolvedValue(gupyJobs);
    filterAliveMock.mockImplementation(async (jobs: { link: string }[]) => jobs);

    const tools = createChatTools('user-1');
    const exec = (tools.search_jobs as unknown as { execute: (args: { query: string }) => Promise<unknown> }).execute;
    await exec({ query: 'Dev' });
    await exec({ query: 'Dev' });
    const third = await exec({ query: 'Dev' });
    expect(third).toEqual({ error: expect.stringContaining('Limite de 2 buscas') });
    expect(searchJobsMock).toHaveBeenCalledTimes(2);
  });
});
