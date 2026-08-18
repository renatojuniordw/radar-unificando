import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { jobRepository, profileRepository } from '@/lib/infrastructure/repositories';
import { mapJobToApi } from '@/lib/core/jobs/map-job';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth();
    const userId = session?.user?.id;
    const recommended = searchParams.get('recommended') === '1';

    // Modo recomendado
    if (recommended) {
      if (!userId) {
        return NextResponse.json([]); // Anônimo → vazio
      }

      const profile = await profileRepository.findByUserId(userId);
      if (!profile) {
        return NextResponse.json([]); // Sem perfil → vazio
      }

      const recommendedJobs = await jobRepository.findRecommendedByUserId(userId, {
        currentRole: profile.currentRole,
        area: profile.area,
        skills: (profile.skills as string[]) || [],
      });

      // Mapeia para o formato da API
      const mapped = recommendedJobs.map(({ job: j, score }) => mapJobToApi(j, score));

      return NextResponse.json(mapped);
    }

    // Modo normal (fluxo existente)
    const normalUserId = userId || '00000000-0000-0000-0000-000000000000';
    const result = await jobRepository.findByUserId(normalUserId, {
      platform: searchParams.get('platform') || undefined,
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const mapped = result.map(j => mapJobToApi(j));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('[vagas] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vagas' },
      { status: 500 }
    );
  }
}
