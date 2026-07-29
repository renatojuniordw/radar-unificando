import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { auth } from '@/auth';
import { scoringEngine } from '@/lib/core/matching/scoring-engine';
import { resumeAdapter } from '@/lib/core/matching/resume-adapter';
import { findMatchingSkills } from '@/lib/core/matching/skill-taxonomy';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'jobId é obrigatório' }, { status: 400 });
    }

    const [profile, job] = await Promise.all([
      prisma.profile.findFirst({ where: { userId: session.user.id } }),
      prisma.job.findFirst({ where: { id: jobId, userId: session.user.id } }),
    ]);

    if (!profile) {
      return NextResponse.json({ error: 'Crie seu perfil primeiro.' }, { status: 404 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 });
    }

    const jobSkills = findMatchingSkills([job.tituloVaga || '', job.descricao || ''].join(' '));

    const candidateProfile = {
      skills: (profile.skills as string[]) || [],
      experienceYears: profile.experienceYears || 0,
      seniority: profile.seniority || 'pleno',
      education: [],
      languages: [],
      domain: '',
      location: '',
      remotePreferred: true,
    };

    const requirements = {
      mandatorySkills: jobSkills.slice(0, 5),
      desirableSkills: jobSkills.slice(5, 10),
      responsibilities: [],
      seniority: 'pleno',
      domain: '',
      education: [],
      languages: [],
      location: job.local || '',
      remote: (job.tipo || '').toLowerCase().includes('remote'),
    };

    const match = scoringEngine.calculate(candidateProfile, requirements);
    const adaptedResume = resumeAdapter.adapt(candidateProfile, requirements, match);

    return NextResponse.json({
      adaptedResume,
      empresa: job.empresa,
      tituloVaga: job.tituloVaga,
      score: Math.round(match.totalScore * 100),
      match,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao adaptar currículo' },
      { status: 500 }
    );
  }
}
