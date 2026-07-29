import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { applications } from '@/lib/infrastructure/db/schema';
import { auth } from '@/auth';
import { canTransition, InvalidStatusTransition } from '@/lib/core/application/state-machine';
import type { Stage } from '@/lib/core/application/state-machine';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const { stage } = await req.json();

  if (!stage) {
    return NextResponse.json({ error: 'stage é obrigatório' }, { status: 400 });
  }

  const db = getDb();

  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, session.user.id)))
    .limit(1);

  if (!app) {
    return NextResponse.json({ error: 'Candidatura não encontrada' }, { status: 404 });
  }

  if (!canTransition(app.stage as Stage, stage as Stage)) {
    throw new InvalidStatusTransition(app.stage, stage);
  }

  const [updated] = await db
    .update(applications)
    .set({ stage })
    .where(eq(applications.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
