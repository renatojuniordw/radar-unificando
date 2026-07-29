import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { jobs, profiles } from '@/lib/infrastructure/db/schema';
import { auth } from '@/auth';
import { scoringEngine } from '@/lib/core/matching/scoring-engine';
import { findMatchingSkills } from '@/lib/core/matching/skill-taxonomy';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const db = getDb();
  const userId = session.user.id;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado. Crie seu perfil primeiro.' }, { status: 404 });
  }

  const userJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.userId, userId))
    .limit(100);

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
