import { NextRequest, NextResponse } from 'next/server';
import { eq, like } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { jobs } from '@/lib/infrastructure/db/schema';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id || 'anonymous';
  const db = getDb();

  const result = await db
    .select({ empresa: jobs.empresa })
    .from(jobs)
    .where(eq(jobs.userId, userId))
    .groupBy(jobs.empresa)
    .orderBy(jobs.empresa);

  const names = result.map(r => r.empresa).filter(Boolean);
  return NextResponse.json(names);
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || 'anonymous';
    const { companies } = await req.json();

    if (!Array.isArray(companies)) {
      return NextResponse.json({ error: 'companies deve ser uma lista' }, { status: 400 });
    }

    const names = companies.map(String).map(s => s.trim()).filter(Boolean);
    return NextResponse.json({ count: names.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar empresas' },
      { status: 500 }
    );
  }
}
