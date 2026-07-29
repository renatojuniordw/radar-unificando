import { NextRequest, NextResponse } from 'next/server';
import { eq, like, and, or } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { jobs } from '@/lib/infrastructure/db/schema';
import { auth } from '@/auth';
import type { Job } from '@/lib/infrastructure/db/schema';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session = await auth();
  const userId = session?.user?.id || 'anonymous';

  const db = getDb();

  const filters: any[] = [eq(jobs.userId, userId)];

  const plataforma = searchParams.get('plataforma');
  if (plataforma) filters.push(eq(jobs.plataforma, plataforma));

  const cargo = searchParams.get('cargo');
  if (cargo) filters.push(eq(jobs.cargoCategoria, cargo));

  const search = searchParams.get('search');
  if (search) {
    filters.push(or(
      like(jobs.empresa, `%${search}%`),
      like(jobs.tituloVaga, `%${search}%`),
      like(jobs.nomeNaPlataforma, `%${search}%`),
    ));
  }

  const result = await db
    .select()
    .from(jobs)
    .where(and(...filters))
    .orderBy(jobs.createdAt)
    .limit(200);

  const mapped = result.map((j: Job) => ({
    id: j.id,
    empresa: j.empresa,
    plataforma: j.plataforma,
    na_lista: j.naLista || 'Não',
    cargo_categoria: j.cargoCategoria,
    titulo_vaga: j.tituloVaga,
    tipo: j.tipo,
    local: j.local,
    link: j.link,
    nome_na_plataforma: j.nomeNaPlataforma,
    publicado: j.publicado,
    alerta: j.alerta || '',
    detectado_em: j.detectadoEm || '',
  }));

  return NextResponse.json(mapped);
}
