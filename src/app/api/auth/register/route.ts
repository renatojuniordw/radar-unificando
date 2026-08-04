import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/lib/infrastructure/repositories';

import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const { success, msBeforeNext } = await checkRateLimit(ip, 'auth');

  if (!success) {
    const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
    return NextResponse.json(
      { error: `Muitas tentativas de cadastro. Aguarde ${retryAfterSeconds} segundos.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      }
    );
  }

  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, { status: 400 });
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await userRepository.create({
      email,
      passwordHash,
      name: name || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[register] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
