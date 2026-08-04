import { NextRequest, NextResponse } from 'next/server';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const result = await pipelineRunRepository.findById(runId);
  if (!result) {
    return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
  }

  return NextResponse.json(result);
}
