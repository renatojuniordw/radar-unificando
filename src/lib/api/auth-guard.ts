import { NextResponse } from 'next/server';
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

/**
 * Replaces the repeated `const session = await auth(); if (!session?.user?.id) return 401;`
 * pattern in API route handlers. Returns either the authenticated session (with a
 * guaranteed `user.id`) or a ready 401 response — callers do `if (response) return response;`.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    };
  }
  return { session: session as AuthenticatedSession, response: null };
}
