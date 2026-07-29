import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { companyPresenceRepository } from '@/lib/infrastructure/repositories';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const presences = await companyPresenceRepository.findByUserId(session.user.id);
  return NextResponse.json(presences);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { empresa, temGupy, paginaGupy, temInhire, paginaInhire, totalVagasInhire } = await req.json();

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa é obrigatória' }, { status: 400 });
    }

    const result = await companyPresenceRepository.upsert(session.user.id, {
      empresa,
      temGupy: temGupy || '',
      paginaGupy: paginaGupy || '',
      temInhire: temInhire || '',
      paginaInhire: paginaInhire || '',
      totalVagasInhire: totalVagasInhire || 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar presença' },
      { status: 500 }
    );
  }
}
