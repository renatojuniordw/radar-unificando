import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { jobRepository } from '@/lib/infrastructure/repositories';

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const result = await jobRepository.findByUserId(session.user.id, { take: 500 });

    const format = req.nextUrl.searchParams.get('format') || 'csv';

    if (format === 'csv') {
      const headers = [
        'Empresa', 'Plataforma', 'Na sua lista?', 'Categoria do Cargo',
        'Titulo da Vaga', 'Tipo', 'Local', 'Link', 'Nome na Plataforma',
        'Publicado', 'Alerta', 'Detectada em',
      ];

      const csvRows = result.map(j => [
        escapeCsv(j.company), j.platform, j.onList || '',
        escapeCsv(j.roleCategory || ''), escapeCsv(j.title || ''),
        escapeCsv(j.type || ''), escapeCsv(j.location || ''), j.link,
        escapeCsv(j.companyNameOnPlatform || ''), j.postedAt || '',
        escapeCsv(j.alert || ''), j.detectedAt || '',
      ].join(','));

      const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="radar-unificando-vagas-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store, private',
        },
      });
    }

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store, private' } });
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar exportação' }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  const s = String(value || '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
