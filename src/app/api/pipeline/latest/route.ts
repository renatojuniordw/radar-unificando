import { NextResponse } from 'next/server';
import { getContainer } from '@/lib/di/container';

export async function GET() {
  const { runRepo } = getContainer();
  const run = await runRepo.findLatest();

  if (!run) {
    return NextResponse.json({ error: 'Nenhuma execução encontrada' }, { status: 404 });
  }

  return NextResponse.json(run);
}
