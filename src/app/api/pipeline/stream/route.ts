import { NextRequest } from 'next/server';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import type { ProgressEvent } from '@/types';

const TERMINAL_EVENTS = new Set(['pipeline_complete', 'pipeline_error', 'pipeline_cancelled']);

function terminalEventTypeFromStatus(status: string): ProgressEvent['type'] {
  switch (status) {
    case 'completed': return 'pipeline_complete';
    case 'failed': return 'pipeline_error';
    case 'cancelled': return 'pipeline_cancelled';
    default: return 'pipeline_complete';
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  if (!runId) {
    return new Response('runId é obrigatório', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      function close() {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        unsubscribe();
        try { controller.close(); } catch { }
      }

      const send = (event: ProgressEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          if (TERMINAL_EVENTS.has(event.type)) {
            close();
          }
        } catch { close(); }
      };

      const unsubscribe = progressEmitter.on(runId, send);

      pipelineRunRepository.findById(runId).then((run) => {
        if (run && ['completed', 'failed', 'cancelled'].includes(run.status)) {
          send({
            type: terminalEventTypeFromStatus(run.status),
            message: `Pipeline ${run.status}`,
          });
        }
      });

      const keepAlive = setInterval(() => {
        try {
          if (!closed) controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch { close(); }
      }, 15000);

      req.signal.addEventListener('abort', close);
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
