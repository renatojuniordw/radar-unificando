import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { passwordSchema } from '@/lib/core/auth/password-schema';
import { hashPasswordResetToken } from '@/lib/core/auth/password-reset-token';
import { getClientIp, rateLimitResponse, validationErrorResponse, routeErrorResponse } from '@/lib/api/route-helpers';

const resetPasswordSchema = z.object({
  token: z.string({ message: 'Token é obrigatório' }).regex(/^[0-9a-f]{64}$/, 'Token inválido'),
  password: passwordSchema,
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success, msBeforeNext } = await checkRateLimit(ip, 'auth');

  if (!success) {
    return rateLimitResponse(msBeforeNext);
  }

  try {
    const parsed = resetPasswordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
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
    return routeErrorResponse(error, 'reset-password', 'Erro ao redefinir a senha');
  }
}