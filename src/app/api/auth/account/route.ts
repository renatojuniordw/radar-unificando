import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/api/auth-guard';
import { userRepository } from '@/lib/infrastructure/repositories';

/**
 * DELETE /api/auth/account
 * Exclui a conta do usuário e todos os dados pessoais associados (LGPD Art. 18, VI).
 * Requer autenticação. Executa exclusão em cascata de todas as tabelas.
 */
export async function DELETE() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    await userRepository.deleteAllUserData(session.user.id);

    // Encerra a sessão JWT do usuário limpando os cookies de sessão do NextAuth.
    // Não usamos signOut() aqui: em NextAuth v5 ele é uma server action e não pode
    // ser invocado de dentro de um route handler (causa erro em runtime).
    const cookieStore = await cookies();
    cookieStore.delete('authjs.session-token');
    cookieStore.delete('__Secure-authjs.session-token');

    return NextResponse.json({
      success: true,
      message: 'Conta e todos os dados pessoais foram excluídos com sucesso.',
    });
  } catch (error) {
    console.error('[account] Erro ao excluir conta:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir conta. Tente novamente.' },
      { status: 500 },
    );
  }
}
