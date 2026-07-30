import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/repositories', () => ({
  pipelineRunRepository: { findById: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: { on: vi.fn().mockReturnValue(vi.fn()) },
}));

import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { GET } from '@/app/api/pipeline/stream/route';

function makeRequest(runId?: string): any {
  const url = new URL(`http://localhost/api/pipeline/stream${runId ? `?runId=${runId}` : ''}`);
  return { url: url.toString(), signal: new AbortController().signal } as any;
}

describe('Pipeline Stream', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_return_400_when_runId_missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('runId é obrigatório');
  });

  it('should_return_sse_response_when_runId_provided', async () => {
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ id: 'run-1', status: 'running' } as any);
    const res = await GET(makeRequest('run-1'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('should_subscribe_to_progress_emitter', async () => {
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ id: 'run-1', status: 'running' } as any);
    await GET(makeRequest('run-1'));
    expect(progressEmitter.on).toHaveBeenCalledWith('run-1', expect.any(Function));
  });

  it('should_emit_complete_if_run_already_finished', async () => {
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ id: 'run-1', status: 'completed' } as any);
    await GET(makeRequest('run-1'));
    expect(progressEmitter.on).toHaveBeenCalled();
  });
});
