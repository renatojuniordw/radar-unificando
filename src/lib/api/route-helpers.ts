import { NextRequest, NextResponse } from 'next/server';
import type { ZodError } from 'zod';

/** Extrai o IP real do cliente a partir dos headers de proxy. */
export function getClientIp(req: NextRequest): string {
  return req.headers?.get?.('x-forwarded-for') || req.headers?.get?.('x-real-ip') || '127.0.0.1';
}

/**
 * Constrói uma resposta 429 padrão com header Retry-After.
 * Usada em rotas que usam checkRateLimit() do rate-limit.ts.
 */
export function rateLimitResponse(msBeforeNext: number, message?: string): NextResponse {
  const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
  return NextResponse.json(
    { error: message || `Muitas tentativas. Aguarde ${retryAfterSeconds} segundos.` },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  );
}

/**
 * Constrói uma resposta 400 a partir de um ZodError.
 * Extrai a primeira mensagem de erro do schema.
 */
export function validationErrorResponse(error: ZodError, fallback = 'Dados inválidos'): NextResponse {
  return NextResponse.json(
    { error: error.issues[0]?.message || fallback },
    { status: 400 },
  );
}

/**
 * Constrói uma resposta 500 para erros inesperados em rotas.
 * Loga o erro no console com o label informado.
 */
export function routeErrorResponse(error: unknown, label: string, message = 'Erro interno'): NextResponse {
  console.error(`[${label}] Error:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}
