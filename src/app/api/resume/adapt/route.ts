import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { profileRepository, jobRepository } from '@/lib/infrastructure/repositories';
import { adaptResumeForJob } from '@/lib/core/ai/resume-adapt';

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

    const resumeContext = profile.resumeMarkdown || profile.resumeText || '';

    const result = await adaptResumeForJob(
      resumeContext,
      job.tituloVaga || '',
      job.descricao || '',
      (profile.skills as string[]) || [],
      profile.experienceYears || 0,
      profile.seniority || 'pleno',
      (profile.education as string[]) || [],
      traceId,
    );

    return NextResponse.json({
      adaptedResume: result.resume,
      highlights: result.highlights,
      missingSkills: result.missingSkills,
      empresa: job.empresa,
      tituloVaga: job.tituloVaga,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao adaptar currículo';
    console.error('[adapt] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
