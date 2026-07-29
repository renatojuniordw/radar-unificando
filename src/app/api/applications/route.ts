import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { applicationRepository } from '@/lib/infrastructure/repositories';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const result = await applicationRepository.findByUserId(session.user.id);
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

    const existing = await applicationRepository.findByUserAndJob(session.user.id, jobId);
    if (existing) {
      return NextResponse.json(existing);
    }

    const app = await applicationRepository.create({
      userId: session.user.id,
      jobId,
      stage,
    });

    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar candidatura' },
      { status: 500 }
    );
  }
}
