import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { pipelineRuns } from '@/lib/infrastructure/db/schema';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id || 'anonymous';
  const db = getDb();

  const result = await db
    .select()
    .from(pipelineRuns)
    .where(eq(pipelineRuns.userId, userId))
    .orderBy(pipelineRuns.startedAt)
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: 'Nenhuma execução encontrada' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
