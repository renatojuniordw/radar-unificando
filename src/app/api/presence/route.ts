import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const presences = await prisma.companyPresence.findMany({
    where: { userId: session.user.id },
    orderBy: { empresa: 'asc' },
  });

  return NextResponse.json(presences);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { empresa, temGupy, paginaGupy, temInhire, paginaInhire, totalVagasInhire } = data;

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa é obrigatória' }, { status: 400 });
    }

    const result = await prisma.companyPresence.upsert({
      where: {
        id: `${session.user.id}_${empresa}`,
      },
      create: {
        userId: session.user.id,
        empresa,
        temGupy: temGupy || '',
        paginaGupy: paginaGupy || '',
        temInhire: temInhire || '',
        paginaInhire: paginaInhire || '',
        totalVagasInhire: totalVagasInhire || 0,
      },
      update: {
        temGupy: temGupy || '',
        paginaGupy: paginaGupy || '',
        temInhire: temInhire || '',
        paginaInhire: paginaInhire || '',
        totalVagasInhire: totalVagasInhire || 0,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar presença' },
      { status: 500 }
    );
  }
}
