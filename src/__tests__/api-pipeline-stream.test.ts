import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/infrastructure/repositories', () => ({
  pipelineRunRepository: { findById: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: { on: vi.fn(), emit: vi.fn() },
}));

import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { GET } from '@/app/api/pipeline/stream/route';

function makeRequest(url = 'http://localhost/api/pipeline/stream?runId=run-1'): NextRequest {
  const controller = new AbortController();
  return { url, signal: controller.signal } as any;
}

async function readAll(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const chunks: string[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(new TextDecoder().decode(value));
  }
  return chunks.join('');
}

describe('Pipeline Stream API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(progressEmitter.on).mockReturnValue(() => {});
  });

  it('should_return_400_when_run_id_missing', async () => {
    const res = await GET(makeRequest('http://localhost/api/pipeline/stream'));
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('runId é obrigatório');
  });

  it('should_return_sse_headers', async () => {
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ status: 'running' } as any);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.headers.get('Cache-Control')).toBe('no-cache');
    expect(res.headers.get('X-Accel-Buffering')).toBe('no');
  });

  it('should_send_terminal_event_when_run_already_completed', async () => {
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ status: 'completed' } as any);
    const res = await GET(makeRequest());
    const text = await readAll(res.body!);
    expect(text).toContain('data: ');
    expect(text).toContain('pipeline_complete');
  });

  it('should_send_terminal_event_when_run_already_failed', async () => {
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ status: 'failed' } as any);
    const res = await GET(makeRequest());
    const text = await readAll(res.body!);
    expect(text).toContain('pipeline_error');
  });

  it('should_send_terminal_event_when_run_already_cancelled', async () => {
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ status: 'cancelled' } as any);
    const res = await GET(makeRequest());
    const text = await readAll(res.body!);
    expect(text).toContain('pipeline_cancelled');
  });

  it('should_forward_live_events_and_close_on_terminal_event', async () => {
    let sendCb: ((event: any) => void) | undefined;
    vi.mocked(progressEmitter.on).mockImplementation((_runId: string, cb: any) => {
      sendCb = cb;
      return () => {};
    });
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ status: 'running' } as any);

    const res = await GET(makeRequest());
    const reader = res.body!.getReader();

    sendCb!({ type: 'pipeline_step', message: 'buscando vagas' });
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain('pipeline_step');

    sendCb!({ type: 'pipeline_complete', message: 'concluído' });
    const second = await reader.read();
    expect(new TextDecoder().decode(second.value)).toContain('pipeline_complete');

    const done = await reader.read();
    expect(done.done).toBe(true);
  });

  it('should_not_enqueue_after_close', async () => {
    let sendCb: ((event: any) => void) | undefined;
    vi.mocked(progressEmitter.on).mockImplementation((_runId: string, cb: any) => {
      sendCb = cb;
      return () => {};
    });
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ status: 'running' } as any);

    const res = await GET(makeRequest());
    const reader = res.body!.getReader();

    sendCb!({ type: 'pipeline_complete', message: 'fim' });
    await reader.read();
    sendCb!({ type: 'pipeline_step', message: 'depois do fim' });
    const after = await reader.read();
    expect(after.done).toBe(true);
  });

  it('should_send_keepalive_every_15_seconds_and_stop_after_close', async () => {
    vi.useFakeTimers();
    try {
      let sendCb: ((event: any) => void) | undefined;
      vi.mocked(progressEmitter.on).mockImplementation((_runId: string, cb: any) => {
        sendCb = cb;
        return () => {};
      });
      vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ status: 'running' } as any);

      const res = await GET(makeRequest());
      const reader = res.body!.getReader();

      await vi.advanceTimersByTimeAsync(15000);
      const first = await reader.read();
      expect(new TextDecoder().decode(first.value)).toContain('keepalive');

      await vi.advanceTimersByTimeAsync(15000);
      const second = await reader.read();
      expect(new TextDecoder().decode(second.value)).toContain('keepalive');

      sendCb!({ type: 'pipeline_complete', message: 'fim' });
      await reader.read();
      const done = await reader.read();
      expect(done.done).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should_close_stream_when_client_aborts', async () => {
    const controller = new AbortController();
    vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ status: 'running' } as any);
    const res = await GET({ url: 'http://localhost/api/pipeline/stream?runId=run-1', signal: controller.signal } as any);
    const reader = res.body!.getReader();
    controller.abort();
    const done = await reader.read();
    expect(done.done).toBe(true);
  });
});