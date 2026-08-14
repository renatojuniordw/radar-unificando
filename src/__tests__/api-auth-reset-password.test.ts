import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/infrastructure/repositories', () => ({
  userRepository: { findByResetTokenHash: vi.fn(), updatePassword: vi.fn() },
}));

vi.mock('@/lib/infrastructure/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, msBeforeNext: 0 }),
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
  hash: vi.fn().mockResolvedValue('hashed-password'),
}));

import { POST } from '@/app/api/auth/reset-password/route';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';

function makeRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: { get: () => null },
    url: 'http://localhost/api/auth/reset-password',
  } as any;
}

const VALID_TOKEN = 'a'.repeat(64);
const VALID_PASSWORD = 'Senha123!';

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_429_with_retry_after_when_rate_limited', async () => {
    (checkRateLimit as any).mockResolvedValueOnce({ success: false, msBeforeNext: 60000 });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('should_return_400_when_token_missing', async () => {
    const res = await POST(makeRequest({ password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
  });

  it('should_return_400_when_token_malformed', async () => {
    const res = await POST(makeRequest({ token: 'short', password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
  });

  it('should_return_400_when_password_lacks_complexity', async () => {
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: 'simplepassword' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('maiúscula');
  });

  it('should_return_400_when_token_not_found', async () => {
    (userRepository.findByResetTokenHash as any).mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('inválido ou expirado');
  });

  it('should_return_400_when_token_expired', async () => {
    (userRepository.findByResetTokenHash as any).mockResolvedValueOnce({
      id: 'user-1',
      resetTokenExpiresAt: new Date(Date.now() - 1000),
    });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
  });

  it('should_return_400_when_expires_at_is_null', async () => {
    (userRepository.findByResetTokenHash as any).mockResolvedValueOnce({
      id: 'user-1',
      resetTokenExpiresAt: null,
    });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
  });

  it('should_update_password_on_valid_token', async () => {
    (userRepository.findByResetTokenHash as any).mockResolvedValueOnce({
      id: 'user-1',
      resetTokenExpiresAt: new Date(Date.now() + 3600_000),
    });

    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(userRepository.updatePassword).toHaveBeenCalledWith('user-1', 'hashed-password');
  });

  it('should_return_500_when_repository_throws', async () => {
    (userRepository.findByResetTokenHash as any).mockRejectedValueOnce(new Error('db down'));
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(500);
  });
});