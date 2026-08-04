import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GupyMcpClient } from '@/lib/core/mcp/gupy-client';

const client = new GupyMcpClient();

describe('GupyMcpClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should_return_normalized_jobs_on_successful_response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: '1',
        result: {
          content: [{ type: 'text', text: JSON.stringify({ jobs: [{ company: 'CorpA', title: 'Data Analyst', workplaceType: 'Remoto', location: 'Remote', jobUrl: 'https://a.com', publishedDate: '2024-01-01' }] }) }],
        },
      }),
    }) as any;
    const result = await client.searchJobs('Data Analyst', 10);
    expect(result).toHaveLength(1);
    expect(result[0].plataforma).toBe('Gupy');
    expect(result[0].empresa).toBe('CorpA');
  });

  it('should_return_empty_array_when_http_fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(client.searchJobs('test', 10)).rejects.toThrow('MCP HTTP 500');
  });

  it('should_throw_on_mcp_error_response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: '1', error: { code: -32000, message: 'Internal error' } }),
    }) as any;
    await expect(client.searchJobs('test', 10)).rejects.toThrow('MCP error: Internal error');
  });

  it('should_return_empty_array_when_no_text_content', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: '1', result: { content: [{ type: 'image', text: '' }] } }),
    }) as any;
    const result = await client.searchJobs('test', 10);
    expect(result).toEqual([]);
  });

  it('should_return_empty_array_on_json_parse_failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: '1', result: { content: [{ type: 'text', text: 'invalid json' }] } }),
    }) as any;
    const result = await client.searchJobs('test', 10);
    expect(result).toEqual([]);
  });

  it('should_infer_role_from_title', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0', id: '1',
        result: { content: [{ type: 'text', text: JSON.stringify({ jobs: [{ title: 'Business Analyst', company: 'Corp', jobUrl: '' }] }) }] },
      }),
    }) as any;
    const result = await client.searchJobs('Business Analyst', 10);
    expect(result[0].cargo_categoria).toContain('Business Analyst');
  });

  it('should_handle_missing_fields_with_fallbacks', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0', id: '1',
        result: { content: [{ type: 'text', text: JSON.stringify([{ name: 'Dev', empresa: 'Startup' }]) }] },
      }),
    }) as any;
    const result = await client.searchJobs('Dev', 10);
    expect(result[0].empresa).toBe('Startup');
    expect(result[0].titulo_vaga).toBe('Dev');
  });
});
