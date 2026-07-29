import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/di/container';
import type { Platform } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { jobRepo } = getContainer();

  const filters = {
    plataforma: (searchParams.get('plataforma') as Platform) || undefined,
    empresa: searchParams.get('empresa') || undefined,
    cargo_categoria: searchParams.get('cargo') || undefined,
    na_lista: (searchParams.get('na_lista') as 'Sim' | 'Não') || undefined,
    search: searchParams.get('search') || undefined,
  };

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined)
  );

  const jobs = await jobRepo.findAll(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined);
  return NextResponse.json(jobs);
}
