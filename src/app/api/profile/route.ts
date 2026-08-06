import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { computeResumeHash } from '@/lib/core/upload/resume-hash';

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const result = await profileRepository.findByUserId(session.user.id);
  return NextResponse.json(result || null);
}

export async function PUT(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const data = await req.json();
    const resumeText = data.resumeText || null;
    const resumeMarkdown = data.resumeMarkdown || null;
    await profileRepository.upsert(session.user.id, {
      skills: data.skills || [],
      experienceYears: data.experienceYears || null,
      seniority: data.seniority || null,
      currentRole: data.currentRole || null,
      area: data.area || null,
      education: data.education || [],
      resumeText,
      resumeMarkdown,
      resumeHash: computeResumeHash(resumeText, resumeMarkdown),
      profileSource: data.profileSource || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[profile] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar perfil' },
      { status: 500 }
    );
  }
}
