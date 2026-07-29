import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/di/container';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';

  const { jobRepo } = getContainer();
  const jobs = await jobRepo.findAll();

  if (format === 'csv') {
    const headers = [
      'Empresa', 'Plataforma', 'Na sua lista?', 'Categoria do Cargo',
      'Titulo da Vaga', 'Tipo', 'Local', 'Link', 'Nome na Plataforma',
      'Publicado', 'Alerta', 'Detectada em',
    ];

    const csvRows = jobs.map(j => [
      escapeCsv(j.empresa),
      j.plataforma,
      j.na_lista,
      escapeCsv(j.cargo_categoria),
      escapeCsv(j.titulo_vaga),
      escapeCsv(j.tipo),
      escapeCsv(j.local),
      j.link,
      escapeCsv(j.nome_na_plataforma),
      j.publicado,
      escapeCsv(j.alerta),
      j.detectado_em || '',
    ].join(','));

    const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="radar-unificando-vagas-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(jobs);
}

function escapeCsv(value: string): string {
  const s = String(value || '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
