import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { generatePasswordResetToken } from '@/lib/core/auth/password-reset-token';
import { sendPasswordResetEmail } from '@/lib/infrastructure/email/email-service';

const forgotPasswordSchema = z.object({
  email: z.string({ message: 'Email é obrigatório' }).trim().email('Email inválido'),
});

export async function POST(req: NextRequest) {
  const ip = req.headers?.get?.('x-forwarded-for') || req.headers?.get?.('x-real-ip') || '127.0.0.1';

  // Limites por IP: 3/minuto e 10/dia (perfis dedicados ao forgot-password).
  const [ipLimit, ipDailyLimit] = await Promise.all([
    checkRateLimit(ip, 'forgot_password'),
    checkRateLimit(ip, 'forgot_password_daily'),
  ]);

  if (!ipLimit.success || !ipDailyLimit.success) {
    const retryAfterMs = Math.max(
      ipLimit.success ? 0 : ipLimit.msBeforeNext,
      ipDailyLimit.success ? 0 : ipDailyLimit.msBeforeNext
    );
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
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

    // Limite por e-mail (3/hora): consumido para qualquer endereço,
    // exista a conta ou não, para não vazar quais e-mails estão cadastrados.
    const emailLimit = await checkRateLimit(`email:${email.toLowerCase()}`, 'forgot_password_email');
    if (!emailLimit.success) {
      const retryAfterSeconds = Math.ceil(emailLimit.msBeforeNext / 1000);
      return NextResponse.json(
        { error: `Muitas solicitações para este e-mail. Aguarde ${retryAfterSeconds} segundos.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

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