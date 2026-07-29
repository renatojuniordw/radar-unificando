import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/di/container';

export async function GET() {
  const { companyRepo } = getContainer();
  const companies = await companyRepo.findAll();
  return NextResponse.json(companies);
}

export async function PUT(req: NextRequest) {
  try {
    const { companies } = await req.json();
    if (!Array.isArray(companies)) {
      return NextResponse.json({ error: 'companies deve ser uma lista' }, { status: 400 });
    }

    const { companyRepo } = getContainer();
    const names = companies.map(String).map(s => s.trim()).filter(Boolean);
    await companyRepo.setList(names);

    return NextResponse.json({ count: names.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar empresas' },
      { status: 500 }
    );
  }
}
