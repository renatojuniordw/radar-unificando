import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';

// Apenas para extrair o tipo de sessão da chamada auth() sem args
// (ReturnType<typeof auth> resolve para o overload de middleware).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSession() {
  return await auth();
}

type AuthSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

type AuthenticatedSession = AuthSession & {
  user: NonNullable<AuthSession['user']> & { id: string };
};

type AuthResult =
  | { session: AuthenticatedSession; response: null }
  | { session: null; response: NextResponse };

const SESSION_COOKIE_NAME = process.env.NODE_ENV === 'production'
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token';

/**
 * Responde 401 e limpa o cookie de sessão. Usada em todo lugar que retorna 401
 * (sessão ausente/inválida, ou JWT válido mas apontando para um user.id que já
 * não existe no banco) — evita que o cliente continue reenviando um cookie
 * morto em toda requisição seguinte.
 */
function unauthorizedResponse(message = 'Não autenticado'): NextResponse {
  const response = NextResponse.json({ error: message }, { status: 401 });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

/** Alias usado no caminho de violação de FK (ver isForeignKeyViolation). */
export const staleSessionResponse = () => unauthorizedResponse('Sessão inválida, faça login novamente');

/**
 * Sentinel usado por jobs assíncronos (ex.: uploadJobStore) para sinalizar que
 * falharam por sessão obsoleta (FK violation), já que rodam fora do ciclo
 * request/response e não podem retornar staleSessionResponse() diretamente.
 */
export const STALE_SESSION_ERROR_CODE = 'STALE_SESSION';

/**
 * Detecta violação de FK do Prisma (ex.: chats_user_id_fkey) — sinal de que o
 * `user.id` do JWT da sessão não existe mais no banco (ex.: banco recriado
 * enquanto o cookie de sessão antigo ainda era válido).
 */
export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
}

/**
 * Replaces the repeated `const session = await auth(); if (!session?.user?.id) return 401;`
 * pattern in API route handlers. Returns either the authenticated session (with a
 * guaranteed `user.id`) or a ready 401 response — callers do `if (response) return response;`.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, response: unauthorizedResponse() };
  }
  return { session: session as AuthenticatedSession, response: null };
}

/**
 * Exige autenticação E role de admin. Usado em APIs administrativas —
 * responde 403 para usuários logados sem privilégio de admin.
 *
 * NOTA: a role vem do JWT (gravada no sign-in em auth.config.ts). Uma mudança
 * de role no banco só reflete após o usuário re-logar — comportamento aceito
 * (evita um SELECT de role por request em toda chamada autenticada).
 */
export async function requireAdmin(): Promise<AuthResult> {
  const { session, response } = await requireAuth();
  if (response) return { session: null, response };
  if ((session.user as { role?: string }).role !== 'admin') {
    return {
      session: null,
      response: NextResponse.json({ error: 'Não autorizado' }, { status: 403 }),
    };
  }
  return { session, response: null };
}

/**
 * Extrai o token Bearer do header Authorization de uma NextRequest.
 * Centralizado para evitar duplicação entre rotas de extensão.
 */
export function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}
