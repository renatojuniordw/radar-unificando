import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/infrastructure/repositories', () => ({
  userRepository: { findByEmail: vi.fn(), setResetToken: vi.fn() },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, msBeforeNext: 0 }),
}));

vi.mock('@/lib/core/auth/password-reset-token', () => ({
  generatePasswordResetToken: vi.fn().mockReturnValue({
    token: 'a'.repeat(64),
    hash: 'b'.repeat(64),
    expiresAt: new Date('2026-01-01T00:00:00Z'),
  }),
}));

vi.mock('@/lib/infrastructure/email/email-service', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from '@/app/api/auth/forgot-password/route';
import { userRepository } from '@/lib/infrastructure/repositories';
import { checkRateLimit } from '@/lib/rate-limit';
import { generatePasswordResetToken } from '@/lib/core/auth/password-reset-token';
import { sendPasswordResetEmail } from '@/lib/infrastructure/email/email-service';

function makeRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: { get: () => null },
    url: 'http://localhost/api/auth/forgot-password',
  } as any;
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_400_when_email_missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('should_return_400_when_email_invalid', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('should_return_429_with_retry_after_when_rate_limited', async () => {
    (checkRateLimit as any).mockResolvedValueOnce({ success: false, msBeforeNext: 60000 });
    const res = await POST(makeRequest({ email: 'test@test.com' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('should_return_429_when_email_rate_limited', async () => {
    (checkRateLimit as any)
      .mockResolvedValueOnce({ success: true, msBeforeNext: 0 }) // IP por minuto
      .mockResolvedValueOnce({ success: true, msBeforeNext: 0 }) // IP diário
      .mockResolvedValueOnce({ success: false, msBeforeNext: 3600000 }); // por e-mail
    const res = await POST(makeRequest({ email: 'test@test.com' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('3600');
    expect(checkRateLimit).toHaveBeenCalledWith('email:test@test.com', 'forgot_password_email');
  });

  it('should_send_reset_email_when_user_exists', async () => {
    (userRepository.findByEmail as any).mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@test.com',
    });

    const res = await POST(makeRequest({ email: 'test@test.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    const { hash, expiresAt } = generatePasswordResetToken();
    expect(userRepository.setResetToken).toHaveBeenCalledWith('user-1', hash, expiresAt);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@test.com',
      'http://localhost/reset-password?token=' + 'a'.repeat(64),
    );
  });

  it('should_return_success_without_sending_when_user_not_found', async () => {
    (userRepository.findByEmail as any).mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ email: 'nao-existe@test.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(userRepository.setResetToken).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should_return_500_when_repository_throws', async () => {
    (userRepository.findByEmail as any).mockRejectedValueOnce(new Error('db down'));
    const res = await POST(makeRequest({ email: 'test@test.com' }));
    expect(res.status).toBe(500);
  });
});