import { NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { auth } from '@/auth';
import { scoringEngine } from '@/lib/core/matching/scoring-engine';
import { findMatchingSkills } from '@/lib/core/matching/skill-taxonomy';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const userId = session.user.id;

  const profile = await prisma.profile.findFirst({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado. Crie seu perfil primeiro.' }, { status: 404 });
  }

  const userJobs = await prisma.job.findMany({
    where: { userId },
    take: 100,
  });

  const profileData = {
    skills: (profile.skills as string[]) || [],
    experienceYears: profile.experienceYears || 0,
    seniority: profile.seniority || 'pleno',
    education: [],
    languages: [],
    domain: '',
    location: '',
    remotePreferred: true,
  };

  const results = userJobs.map(job => {
    const jobSkills = findMatchingSkills([job.tituloVaga || '', job.descricao || ''].join(' '));

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

    const match = scoringEngine.calculate(profileData, requirements);

    return {
      jobId: job.id,
      empresa: job.empresa,
      tituloVaga: job.tituloVaga,
      plataforma: job.plataforma,
      link: job.link,
      score: Math.round(match.totalScore * 100),
      breakdown: match.breakdown,
      matchedSkills: match.matchedSkills,
      missingMandatory: match.missingMandatory,
      evidence: match.evidence,
    };
  });

  results.sort((a, b) => b.score - a.score);

  return NextResponse.json(results);
}
