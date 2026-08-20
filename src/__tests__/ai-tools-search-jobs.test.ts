import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/core/mcp/gupy-client', () => ({
  gupyMcpClient: { searchJobs: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/job-link-filter', () => ({
  jobLinkFilter: { filterAlive: vi.fn() },
}));

import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { jobLinkFilter } from '@/lib/core/pipeline/job-link-filter';
import { createSearchJobsTool } from '@/lib/core/ai/tools/search-jobs';
import { schemaOf, type Tool } from './helpers/ai-tool-fixtures';

describe('createSearchJobsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_reject_query_shorter_than_2_chars', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'a' }).success).toBe(false);
  });

  it('should_reject_query_longer_than_200_chars', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'a'.repeat(201) }).success).toBe(false);
  });

  it('should_reject_query_with_disallowed_characters', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Python!' }).success).toBe(false);
    expect(schema.safeParse({ query: 'Data;Analyst' }).success).toBe(false);
  });

  it('should_accept_query_with_letters_numbers_spaces_hyphen_underscore_dot', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Data-Analyst_2.0' }).success).toBe(true);
  });

  it('should_reject_query_with_accented_letters', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    // OpenAI API does not support Unicode property escapes (\p{L}) in tool schemas,
    // so accented characters are not allowed in queries
    expect(schema.safeParse({ query: 'Data Ánalyst' }).success).toBe(false);
    expect(schema.safeParse({ query: 'Ciência de Dados' }).success).toBe(false);
  });

  it('should_reject_limit_below_1', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Dev', limit: 0 }).success).toBe(false);
  });

  it('should_reject_limit_above_20', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Dev', limit: 21 }).success).toBe(false);
  });

  it('should_default_limit_to_10', () => {
    const schema = schemaOf(createSearchJobsTool('user-1'));
    expect(schema.safeParse({ query: 'Dev' }).success).toBe(true);
  });

  it('should_fetch_double_limit_up_to_40_from_gupy', async () => {
    vi.mocked(gupyMcpClient.searchJobs).mockResolvedValue([]);
    vi.mocked(jobLinkFilter.filterAlive).mockResolvedValue([]);
    const tool = createSearchJobsTool('user-1') as unknown as Tool;

    await tool.execute({ query: 'Dev', limit: 20 });
    expect(gupyMcpClient.searchJobs).toHaveBeenCalledWith('Dev', 40);

    await tool.execute({ query: 'Dev' });
    expect(gupyMcpClient.searchJobs).toHaveBeenLastCalledWith('Dev', 20);
  });

  it('should_return_error_after_two_searches_on_same_instance_but_work_on_new_instance', async () => {
    vi.mocked(gupyMcpClient.searchJobs).mockResolvedValue([]);
    vi.mocked(jobLinkFilter.filterAlive).mockResolvedValue([]);
    const tool = createSearchJobsTool('user-1') as unknown as Tool;

    await tool.execute({ query: 'Dev' });
    await tool.execute({ query: 'Dev' });
    const third = await tool.execute({ query: 'Dev' });
    expect(third).toEqual({ error: expect.stringContaining('Limite de 2 buscas') });
    expect(gupyMcpClient.searchJobs).toHaveBeenCalledTimes(2);

    const fresh = createSearchJobsTool('user-1') as unknown as Tool;
    await fresh.execute({ query: 'Dev' });
    expect(gupyMcpClient.searchJobs).toHaveBeenCalledTimes(3);
  });

  it('should_slice_alive_jobs_to_limit_and_apply_format_job_result', async () => {
    const jobs = [
      { title: 'Dev', company: 'A', type: 'remoto', location: 'SP', link: 'https://gupy.io/1', postedAt: '2026-08-01', description: 'descrição curta' },
      { title: 'Dev2', company: 'B', type: 'hibrido', location: 'RJ', link: 'https://gupy.io/2', postedAt: null, description: null },
    ];
    vi.mocked(gupyMcpClient.searchJobs).mockResolvedValue(jobs as any);
    vi.mocked(jobLinkFilter.filterAlive).mockResolvedValue(jobs as any);
    const tool = createSearchJobsTool('user-1') as unknown as Tool;

    const result = await tool.execute({ query: 'Dev', limit: 1 });
    expect(result).toHaveLength(1);
    expect(jobLinkFilter.filterAlive).toHaveBeenCalledWith(jobs, { concurrency: 5 });
    expect(result[0]).toEqual({
      titulo: 'Dev',
      empresa: 'A',
      tipo: 'remoto',
      local: 'SP',
      link: 'https://gupy.io/1',
      publicado: '2026-08-01',
      descricao: '<untrusted_content>\ndescrição curta\n</untrusted_content>',
    });
  });
});