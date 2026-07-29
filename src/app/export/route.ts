import { NextRequest, NextResponse } from 'next/server';
import { eq, or, like } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { jobs } from '@/lib/infrastructure/db/schema';
import { auth } from '@/auth';
import type { Job } from '@/lib/infrastructure/db/schema';

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id || 'anonymous';
  const db = getDb();

  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.userId, userId))
    .orderBy(jobs.createdAt)
    .limit(500);

  const format = req.nextUrl.searchParams.get('format') || 'csv';

  if (format === 'csv') {
    const headers = [
      'Empresa', 'Plataforma', 'Na sua lista?', 'Categoria do Cargo',
      'Titulo da Vaga', 'Tipo', 'Local', 'Link', 'Nome na Plataforma',
      'Publicado', 'Alerta', 'Detectada em',
    ];

    const csvRows = result.map((j: Job) => [
      escapeCsv(j.empresa), j.plataforma, j.naLista || '',
      escapeCsv(j.cargoCategoria || ''), escapeCsv(j.tituloVaga || ''),
      escapeCsv(j.tipo || ''), escapeCsv(j.local || ''), j.link,
      escapeCsv(j.nomeNaPlataforma || ''), j.publicado || '',
      escapeCsv(j.alerta || ''), j.detectadoEm || '',
    ].join(','));

    const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="radar-unificando-vagas-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(result);
}

function escapeCsv(value: string): string {
  const s = String(value || '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
