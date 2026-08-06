import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/rate-limit';
import { generatePasswordResetToken } from '@/lib/core/auth/password-reset-token';
import { sendPasswordResetEmail } from '@/lib/infrastructure/email/email-service';

const forgotPasswordSchema = z.object({
  email: z.string({ message: 'Email é obrigatório' }).trim().email('Email inválido'),
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
    const parsed = forgotPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const user = await userRepository.findByEmail(email);

    // Anti-enumeração: resposta idêntica independentemente de a conta existir.
    if (user) {
      const { token, hash, expiresAt } = generatePasswordResetToken();
      await userRepository.setResetToken(user.id, hash, expiresAt);

      const base = process.env.AUTH_URL || new URL(req.url).origin;
      await sendPasswordResetEmail(user.email, `${base}/reset-password?token=${token}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}