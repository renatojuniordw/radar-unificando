import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/infrastructure/db/prisma-client';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name || null,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
