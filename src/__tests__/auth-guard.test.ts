import { describe, it, expect, vi, beforeEach } from 'vitest';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));

import { requireAuth, requireAdmin } from '@/lib/api/auth-guard';

describe('requireAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna_401_quando_nao_autenticado', async () => {
    mockAuth.mockResolvedValue(null);
    const { session, response } = await requireAuth();
    expect(session).toBeNull();
    expect(response?.status).toBe(401);
  });

  it('retorna_sessao_quando_autenticado', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as any);
    const { session, response } = await requireAuth();
    expect(response).toBeNull();
    expect(session?.user.id).toBe('u1');
  });
});

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna_401_quando_nao_autenticado', async () => {
    mockAuth.mockResolvedValue(null);
    const { session, response } = await requireAdmin();
    expect(session).toBeNull();
    expect(response?.status).toBe(401);
  });

  it('retorna_403_para_usuario_sem_role_admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'user' } } as any);
    const { session, response } = await requireAdmin();
    expect(session).toBeNull();
    expect(response?.status).toBe(403);
  });

  it('retorna_sessao_para_admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'admin' } } as any);
    const { session, response } = await requireAdmin();
    expect(response).toBeNull();
    expect(session?.user.id).toBe('u1');
  });
});