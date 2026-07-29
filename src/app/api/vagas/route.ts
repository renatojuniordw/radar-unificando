import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth();
    const userId = session?.user?.id || 'anonymous';

    const plataforma = searchParams.get('plataforma');
    const cargo = searchParams.get('cargo');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { userId };

    if (plataforma) where.plataforma = plataforma;
    if (cargo) where.cargoCategoria = cargo;
    if (search) {
      where.OR = [
        { empresa: { contains: search, mode: 'insensitive' } },
        { tituloVaga: { contains: search, mode: 'insensitive' } },
        { nomeNaPlataforma: { contains: search, mode: 'insensitive' } },
      ];
    }

    const result = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    const mapped = result.map(j => ({
      id: j.id,
      empresa: j.empresa,
      plataforma: j.plataforma,
      na_lista: j.naLista || 'Não',
      cargo_categoria: j.cargoCategoria,
      titulo_vaga: j.tituloVaga,
      tipo: j.tipo,
      local: j.local,
      link: j.link,
      nome_na_plataforma: j.nomeNaPlataforma,
      publicado: j.publicado,
      alerta: j.alerta || '',
      detectado_em: j.detectadoEm || '',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar vagas' },
      { status: 500 }
    );
  }
}
