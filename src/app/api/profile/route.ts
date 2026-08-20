import { NextRequest, NextResponse } from 'next/server';
import { isForeignKeyViolation, requireAuth, staleSessionResponse } from '@/lib/api/auth-guard';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { computeResumeHash } from '@/lib/core/upload/resume-hash';
import { profileUpdateSchema } from '@/lib/core/profile/profile-schema';

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
    const parsed = profileUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados do perfil inválidos' },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const resumeText = data.resumeText ?? null;
    const resumeMarkdown = data.resumeMarkdown ?? null;
    await profileRepository.upsert(session.user.id, {
      skills: data.skills,
      experienceYears: data.experienceYears ?? null,
      seniority: data.seniority ?? null,
      currentRole: data.currentRole ?? null,
      area: data.area ?? null,
      education: data.education,
      resumeText,
      resumeMarkdown,
      resumeHash: computeResumeHash(resumeText, resumeMarkdown),
      profileSource: data.profileSource,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isForeignKeyViolation(error)) return staleSessionResponse();
    console.error('[profile] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar perfil' },
      { status: 500 }
    );
  }
}
