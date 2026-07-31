import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { profileRepository, jobRepository } from '@/lib/infrastructure/repositories';
import { analyzeJobFit } from '@/lib/core/ai/job-analyzer';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const traceId = crypto.randomUUID();

  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'jobId é obrigatório' }, { status: 400 });
    }

    const [profile, job] = await Promise.all([
      profileRepository.findByUserId(session.user.id),
      jobRepository.findById(jobId),
    ]);

    if (!profile) {
      return NextResponse.json({ error: 'Crie seu perfil primeiro.' }, { status: 404 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 });
    }

    const parsedData = profile.parsedData as { education?: string[] } | null;

    const analysis = await analyzeJobFit(
      profile.resumeText || profile.resumeMarkdown || '',
      job.tituloVaga || '',
      job.descricao || '',
      (profile.skills as string[]) || [],
      profile.experienceYears || 0,
      profile.seniority || 'pleno',
      parsedData?.education || [],
      traceId,
    );

    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao analisar vaga';
    console.error('[analyze] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
