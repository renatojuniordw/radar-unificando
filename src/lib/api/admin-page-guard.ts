import { auth } from '@/auth';
import { notFound } from 'next/navigation';

/**
 * Guarda de autorização para páginas admin. Deve ser chamada no INÍCIO de cada
 * página (antes de qualquer fetch) — o guarda no layout não impede a renderização
 * da página no payload do 404, então cada página precisa se proteger.
 */
export async function requireAdminPage(): Promise<void> {
  const session = await auth();
  if (!session) notFound();
  if ((session.user as { role?: string }).role !== 'admin') notFound();
}