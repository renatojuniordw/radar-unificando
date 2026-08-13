import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const { requireAuthMock, deleteAllUserDataMock, deleteCookieMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  deleteAllUserDataMock: vi.fn(),
  deleteCookieMock: vi.fn(),
}));

vi.mock('@/lib/api/auth-guard', () => ({
  requireAuth: requireAuthMock,
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  userRepository: { deleteAllUserData: deleteAllUserDataMock },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ delete: deleteCookieMock }),
}));

import { DELETE } from '@/app/api/auth/account/route';

const authenticated = {
  session: { user: { id: 'user-1', email: 'user@test.com' } },
  response: null,
};

function unauthorized(): any {
  return { session: null, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
}

describe('DELETE /api/auth/account (LGPD Art. 18, VI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockResolvedValue(authenticated);
    deleteAllUserDataMock.mockResolvedValue(undefined);
  });

  it('should_return_401_when_not_authenticated', async () => {
    requireAuthMock.mockResolvedValue(unauthorized());
    const res = await DELETE();
    expect(res.status).toBe(401);
    expect(deleteAllUserDataMock).not.toHaveBeenCalled();
  });

  it('should_delete_all_user_data_and_clear_session_cookies', async () => {
    const res = await DELETE();

    expect(deleteAllUserDataMock).toHaveBeenCalledWith('user-1');
    expect(deleteCookieMock).toHaveBeenCalledWith('authjs.session-token');
    expect(deleteCookieMock).toHaveBeenCalledWith('__Secure-authjs.session-token');
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('should_return_500_with_generic_message_on_error', async () => {
    deleteAllUserDataMock.mockRejectedValue(new Error('DB down'));
    const res = await DELETE();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Erro ao excluir conta. Tente novamente.');
    expect(body.error).not.toContain('DB down');
  });
});
