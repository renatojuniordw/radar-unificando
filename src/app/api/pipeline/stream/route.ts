import { NextRequest } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import type { ProgressEvent } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  if (!runId) {
    return new Response('runId é obrigatório', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: ProgressEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* closed */ }
      };

      const unsubscribe = progressEmitter.on(runId, send);

      prisma.pipelineRun.findFirst({ where: { id: runId } }).then((run) => {
        if (run && ['completed', 'failed', 'cancelled'].includes(run.status)) {
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
