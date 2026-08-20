import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { generatePasswordResetToken } from '@/lib/core/auth/password-reset-token';
import { sendPasswordResetEmail } from '@/lib/infrastructure/email/email-service';
import { getClientIp, rateLimitResponse, validationErrorResponse, routeErrorResponse } from '@/lib/api/route-helpers';

const forgotPasswordSchema = z.object({
  email: z.string({ message: 'Email é obrigatório' }).trim().email('Email inválido'),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

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
    return rateLimitResponse(retryAfterMs, 'Muitas tentativas. Aguarde os segundos indicados.');
  }

  try {
    const parsed = forgotPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { email } = parsed.data;

    // Limite por e-mail (3/hora): consumido para qualquer endereço,
    // exista a conta ou não, para não vazar quais e-mails estão cadastrados.
    const emailLimit = await checkRateLimit(`email:${email.toLowerCase()}`, 'forgot_password_email');
    if (!emailLimit.success) {
      return rateLimitResponse(emailLimit.msBeforeNext, 'Muitas solicitações para este e-mail. Aguarde os segundos indicados.');
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
    return routeErrorResponse(error, 'forgot-password', 'Erro ao processar a solicitação');
  }
}