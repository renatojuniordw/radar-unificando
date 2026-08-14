import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { passwordSchema } from '@/lib/core/auth/password-schema';
import { hashPasswordResetToken } from '@/lib/core/auth/password-reset-token';

const resetPasswordSchema = z.object({
  token: z.string({ message: 'Token é obrigatório' }).regex(/^[0-9a-f]{64}$/, 'Token inválido'),
  password: passwordSchema,
});

export async function POST(req: NextRequest) {
  const ip = req.headers?.get?.('x-forwarded-for') || req.headers?.get?.('x-real-ip') || '127.0.0.1';
  const { success, msBeforeNext } = await checkRateLimit(ip, 'auth');

  if (!success) {
    const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
    return NextResponse.json(
      { error: `Muitas tentativas. Aguarde ${retryAfterSeconds} segundos.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      }
    );
  }

  try {
    const parsed = resetPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const hash = hashPasswordResetToken(token);
    const user = await userRepository.findByResetTokenHash(hash);

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await userRepository.updatePassword(user.id, passwordHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[reset-password] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao redefinir a senha' },
      { status: 500 }
    );
  }
}