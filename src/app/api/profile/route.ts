import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const result = await prisma.profile.findFirst({
    where: { userId: session.user.id },
  });

  return NextResponse.json(result || null);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const data = await req.json();

    await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        skills: data.skills || [],
        experienceYears: data.experienceYears || null,
        seniority: data.seniority || null,
        resumeText: data.resumeText || null,
      },
      create: {
        userId: session.user.id,
        skills: data.skills || [],
        experienceYears: data.experienceYears || null,
        seniority: data.seniority || null,
        resumeText: data.resumeText || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar perfil' },
      { status: 500 }
    );
  }
}
