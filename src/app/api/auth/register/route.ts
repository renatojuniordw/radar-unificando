import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { registerCredentialsSchema } from '@/lib/core/auth/register-schema';
import { sendWelcomeEmail } from '@/lib/infrastructure/email/email-service';
import { getClientIp, rateLimitResponse, validationErrorResponse, routeErrorResponse } from '@/lib/api/route-helpers';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success, msBeforeNext } = await checkRateLimit(ip, 'auth');

  if (!success) {
    return rateLimitResponse(msBeforeNext);
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
    const parsed = registerCredentialsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { name, email, password } = parsed.data;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      // Mensagem unificada (mesma da validação) para não confirmar quais emails
      // existem no sistema — evita enumeração de contas (relatório item 1.10).
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await userRepository.create({
      email,
      passwordHash,
      name: name || null,
    });

    // Dispara e-mail de boas-vindas com instruções iniciais em background
    void sendWelcomeEmail(email, name).catch((err) => {
      console.error('[register] Erro ao disparar e-mail de boas-vindas:', err);
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, 'register', 'Erro ao criar conta');
  }
}
