import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const result = await prisma.pipelineRun.findFirst({
    where: { id: runId },
  });

  if (!result) {
    return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
  }

  return NextResponse.json(result);
}
