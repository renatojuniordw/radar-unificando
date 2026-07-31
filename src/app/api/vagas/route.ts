import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { jobRepository, profileRepository } from '@/lib/infrastructure/repositories';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth();
    const userId = session?.user?.id;
    const recomendado = searchParams.get('recomendado') === '1';

    // Modo recomendado
    if (recomendado) {
      if (!userId) {
        return NextResponse.json([]); // Anônimo → vazio
      }

      const profile = await profileRepository.findByUserId(userId);
      if (!profile) {
        return NextResponse.json([]); // Sem perfil → vazio
      }

      const recommended = await jobRepository.findRecommendedByUserId(userId, {
        currentRole: profile.currentRole,
        area: profile.area,
        skills: (profile.skills as string[]) || [],
      });

      // Mapeia para o formato da API
      const mapped = recommended.map(({ job: j, score }) => ({
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
        _score: score, // Score para referência
      }));

      return NextResponse.json(mapped);
    }

    // Modo normal (fluxo existente)
    const normalUserId = userId || '00000000-0000-0000-0000-000000000000';
    const result = await jobRepository.findByUserId(normalUserId, {
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
    console.error('[vagas] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vagas' },
      { status: 500 }
    );
  }
}
