import { describe, it, expect, vi, beforeEach } from 'vitest';

const { nextAuthMock, bcryptCompareMock, credentialsMock } = vi.hoisted(() => ({
  nextAuthMock: vi.fn((_config: unknown) => ({ handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() })),
  bcryptCompareMock: vi.fn(),
  credentialsMock: vi.fn((opts: unknown) => opts),
}));

vi.mock('next-auth', () => ({
  default: nextAuthMock,
  CredentialsSignin: class extends Error {
    code = 'CUSTOM';
  },
}));
vi.mock('next-auth/providers/credentials', () => ({ default: credentialsMock }));
vi.mock('bcryptjs', () => ({ default: { compare: bcryptCompareMock } }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    updateLastLogin: vi.fn(),
  },
}));
vi.mock('@/lib/infrastructure/rate-limit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/auth.config', () => ({ authConfig: {} }));

import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';

import '@/auth';

type AuthorizeFn = (credentials: Record<string, unknown>, request?: { headers?: Headers }) => Promise<unknown>;

// Capturado no load do módulo
const authorize = (() => {
  const cfg = nextAuthMock.mock.calls[0]?.[0] as { providers?: Array<{ authorize?: unknown }> } | undefined;
  const prov = cfg?.providers?.[0];
  return typeof prov?.authorize === 'function' ? (prov.authorize as AuthorizeFn) : undefined;
})() as AuthorizeFn;

describe('auth credentials provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextAuthMock.mockImplementation((_config: unknown) => ({ handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() }));
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, msBeforeNext: 0 } as any);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'Ana',
      role: 'user',
      passwordHash: 'hash',
    } as any);
    bcryptCompareMock.mockResolvedValue(true);
    vi.mocked(userRepository.updateLastLogin).mockResolvedValue(undefined as any);
  });

  function makeHeaders(ip: string): Headers {
    const h = new Headers();
    h.set('x-forwarded-for', ip);
    return h;
  }

  it('should_return_null_when_credentials_missing', async () => {
    expect(await authorize({})).toBeNull();
    expect(await authorize({ email: 'a@b.com' })).toBeNull();
  });

  it('should_throw_rate_limited_error_when_rate_limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, msBeforeNext: 30000 } as any);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      authorize({ email: 'a@b.com', password: 'x' }, { headers: makeHeaders('1.2.3.4') }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(checkRateLimit).toHaveBeenCalledWith('1.2.3.4:a@b.com', 'auth');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('retry em 30s'));
    warn.mockRestore();
  });

  it('should_use_x_real_ip_when_no_forwarded_header', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, msBeforeNext: 1000 } as any);
    const headers = new Headers();
    headers.set('x-real-ip', '9.9.9.9');
    await expect(authorize({ email: 'a@b.com', password: 'x' }, { headers })).rejects.toBeInstanceOf(Error);
    expect(checkRateLimit).toHaveBeenCalledWith('9.9.9.9:a@b.com', 'auth');
  });

  it('should_return_null_when_user_not_found', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    expect(await authorize({ email: 'a@b.com', password: 'x' })).toBeNull();
  });

  it('should_return_null_when_password_invalid', async () => {
    bcryptCompareMock.mockResolvedValue(false);
    expect(await authorize({ email: 'a@b.com', password: 'errado' })).toBeNull();
  });

  it('should_return_user_and_update_last_login_on_success', async () => {
    const user = await authorize({ email: 'a@b.com', password: 'certo' });
    expect(user).toEqual({ id: 'u1', email: 'a@b.com', name: 'Ana', role: 'user' });
    expect(bcryptCompareMock).toHaveBeenCalledWith('certo', 'hash');
    expect(userRepository.updateLastLogin).toHaveBeenCalledWith('u1');
  });

  it('should_return_null_when_repository_throws', async () => {
    vi.mocked(userRepository.findByEmail).mockRejectedValue(new Error('db down'));
    expect(await authorize({ email: 'a@b.com', password: 'x' })).toBeNull();
  });
});