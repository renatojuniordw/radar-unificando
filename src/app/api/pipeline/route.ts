import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/di/container';

export async function POST(req: NextRequest) {
  try {
    const { companies, discoveryEnabled } = await req.json();

    const { runRepo, orchestrator } = getContainer();
    const runId = crypto.randomUUID();
    const discovery = discoveryEnabled !== false;

    await runRepo.create(runId, discovery);

    // Fire and forget — pipeline runs in background
    orchestrator.start(runId, companies || [], discovery);

    return NextResponse.json({ runId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao iniciar pipeline' },
      { status: 500 }
    );
  }
}
