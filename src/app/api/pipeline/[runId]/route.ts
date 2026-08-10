import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { runId } = await params;

  try {
    const result = await pipelineRunRepository.findById(runId);
    if (!result) {
      return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
    }

    if (result.userId !== session.user.id) {
      return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[pipeline/${runId}] Erro ao consultar execução:`, error);
    return NextResponse.json({ error: 'Erro ao consultar a execução' }, { status: 500 });
  }
}
