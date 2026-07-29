import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { pipelineRuns } from '@/lib/infrastructure/db/schema';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const db = getDb();

  const result = await db
    .select()
    .from(pipelineRuns)
    .where(eq(pipelineRuns.id, runId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
