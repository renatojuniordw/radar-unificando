import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { auth } from '@/auth';
import type { Stage } from '@/lib/core/application/state-machine';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const result = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

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

    const existing = await prisma.application.findFirst({
      where: {
        userId: session.user.id,
        jobId,
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const app = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId,
        stage,
      },
    });

    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar candidatura' },
      { status: 500 }
    );
  }
}
