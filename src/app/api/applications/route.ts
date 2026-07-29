import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { applications, jobs } from '@/lib/infrastructure/db/schema';
import { auth } from '@/auth';
import { canTransition, getStageLabel, type Stage } from '@/lib/core/application/state-machine';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const db = getDb();
  const result = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, session.user.id))
    .orderBy(applications.createdAt);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { jobId, stage = 'discovered' } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'jobId é obrigatório' }, { status: 400 });
    }

    const db = getDb();

    const existing = await db
      .select()
      .from(applications)
      .where(and(
        eq(applications.userId, session.user.id),
        eq(applications.jobId, jobId),
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    const [app] = await db.insert(applications).values({
      userId: session.user.id,
      jobId,
      stage,
    }).returning();

    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar candidatura' },
      { status: 500 }
    );
  }
}
