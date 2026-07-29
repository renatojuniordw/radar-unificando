import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/di/container';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const { runRepo } = getContainer();
  const run = await runRepo.findById(runId);

  if (!run) {
    return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
  }

  return NextResponse.json(run);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const { orchestrator } = getContainer();
  orchestrator.cancel(runId);

  return NextResponse.json({ status: 'cancelled' });
}
