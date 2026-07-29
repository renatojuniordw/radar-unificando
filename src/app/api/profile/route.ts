import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { profiles } from '@/lib/infrastructure/db/schema';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const db = getDb();
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  return NextResponse.json(result[0] || null);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const db = getDb();

    await db.insert(profiles).values({
      userId: session.user.id,
      skills: data.skills || [],
      experienceYears: data.experienceYears || null,
      seniority: data.seniority || null,
      resumeText: data.resumeText || null,
    }).onConflictDoUpdate({
      target: profiles.userId,
      set: {
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
