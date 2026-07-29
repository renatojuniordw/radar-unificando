import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canTransition, InvalidStatusTransition } from '@/lib/core/application/state-machine';
import { applicationRepository } from '@/lib/infrastructure/repositories';
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

  const app = await applicationRepository.findByIdAndUser(id, session.user.id);
  if (!app) {
    return NextResponse.json({ error: 'Candidatura não encontrada' }, { status: 404 });
  }

  if (!canTransition(app.stage as Stage, stage as Stage)) {
    throw new InvalidStatusTransition(app.stage, stage);
  }

  const updated = await applicationRepository.updateStage(id, stage, session.user.id);
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
  await applicationRepository.deleteByIdAndUser(id, session.user.id);
  return NextResponse.json({ success: true });
}
