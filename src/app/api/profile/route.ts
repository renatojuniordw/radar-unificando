import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { profileRepository } from '@/lib/infrastructure/repositories';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const result = await profileRepository.findByUserId(session.user.id);
  return NextResponse.json(result || null);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const data = await req.json();
    await profileRepository.upsert(session.user.id, {
      skills: data.skills || [],
      experienceYears: data.experienceYears || null,
      seniority: data.seniority || null,
      currentRole: data.currentRole || null,
      area: data.area || null,
      education: data.education || [],
      resumeText: data.resumeText || null,
      resumeMarkdown: data.resumeMarkdown || null,
      profileSource: data.profileSource || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar perfil' },
      { status: 500 }
    );
  }
}
