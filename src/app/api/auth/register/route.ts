import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '@/lib/infrastructure/repositories';

import { checkRateLimit } from '@/lib/rate-limit';

const registerSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal('')),
  email: z.string({ message: 'Email é obrigatório' }).trim().email('Email inválido'),
  password: z
    .string({ message: 'Senha é obrigatória' })
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula (A-Z)')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula (a-z)')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número (0-9)')
    .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial (!@#$...)')
    .max(200),
});

export async function POST(req: NextRequest) {
  const ip = req.headers?.get?.('x-forwarded-for') || req.headers?.get?.('x-real-ip') || '127.0.0.1';
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

  // Limite diário de criação de contas por IP (anti multi-conta)
  const { success: registerDailyOk } = await checkRateLimit(ip, 'register_daily');
  if (!registerDailyOk) {
    return NextResponse.json(
      { error: 'Limite de cadastros por IP atingido. Tente novamente amanhã.' },
      { status: 429 }
    );
  }

  try {
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

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
