import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { jobRepository } from '@/lib/infrastructure/repositories';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth();
    const userId = session?.user?.id || '00000000-0000-0000-0000-000000000000';

    const result = await jobRepository.findByUserId(userId, {
      plataforma: searchParams.get('plataforma') || undefined,
      cargo: searchParams.get('cargo') || undefined,
      search: searchParams.get('search') || undefined,
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
