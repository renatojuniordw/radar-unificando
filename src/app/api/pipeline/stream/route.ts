import { NextRequest } from 'next/server';
import { getContainer } from '@/lib/di/container';
import type { ProgressEvent } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  if (!runId) {
    return new Response('runId é obrigatório', { status: 400 });
  }

  const { progressEmitter, runRepo } = getContainer();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: ProgressEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* stream closed */ }
      };

      const unsubscribe = progressEmitter.on(runId, send);

      runRepo.findById(runId).then((run) => {
        if (run && (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled')) {
          send({ type: 'pipeline_complete', message: `Pipeline ${run.status}` });
          unsubscribe();
          try { controller.close(); } catch { }
        }
      });

      const keepAlive = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch { clearInterval(keepAlive); }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        unsubscribe();
        try { controller.close(); } catch { }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
