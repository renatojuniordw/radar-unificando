import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const companies = await prisma.newCompany.findMany({
    where: { userId: session.user.id },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { nome, totalVagas, urlCarreiras } = data;

    if (!nome) {
      return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
    }

    const result = await prisma.newCompany.upsert({
      where: {
        id: `${session.user.id}_${nome}`,
      },
      create: {
        userId: session.user.id,
        nome,
        totalVagas: totalVagas || 0,
        urlCarreiras: urlCarreiras || null,
      },
      update: {
        totalVagas: totalVagas || 0,
        urlCarreiras: urlCarreiras || null,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar empresa' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.newCompany.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao deletar empresa' },
      { status: 500 }
    );
  }
}
