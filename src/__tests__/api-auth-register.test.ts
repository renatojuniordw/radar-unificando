import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/infrastructure/repositories', () => ({
  userRepository: { findByEmail: vi.fn(), create: vi.fn() },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
  hash: vi.fn().mockResolvedValue('hashed-password'),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, msBeforeNext: 0 }),
}));

import { POST } from '@/app/api/auth/register/route';
import { userRepository } from '@/lib/infrastructure/repositories';

function makeRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: { get: () => null },
  } as any;
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_400_when_email_missing', async () => {
    const res = await POST(makeRequest({ password: '12345678' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Email');
  });

  it('should_return_400_when_password_missing', async () => {
    const res = await POST(makeRequest({ email: 'test@test.com' }));
    expect(res.status).toBe(400);
  });

  it('should_return_400_when_password_too_short', async () => {
    const res = await POST(makeRequest({ email: 'test@test.com', password: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('8');
  });

  it('should_return_400_when_password_lacks_complexity', async () => {
    const res = await POST(makeRequest({ email: 'test@test.com', password: 'simplepassword' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('maiúscula');
  });

  it('should_return_409_when_email_already_exists', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: '1' } as any);
    const res = await POST(makeRequest({ email: 'existing@test.com', password: 'ValidP@ssword123' }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain('cadastrado');
  });

  it('should_return_201_on_successful_registration', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue({ id: '1' } as any);
    const res = await POST(makeRequest({ email: 'new@test.com', password: 'ValidP@ssword123', name: 'User' }));
    expect(res.status).toBe(201);
    expect((await res.json()).success).toBe(true);
  });

  it('should_return_500_on_repository_error', async () => {
    vi.mocked(userRepository.findByEmail).mockRejectedValue(new Error('DB error'));
    const res = await POST(makeRequest({ email: 'test@test.com', password: 'ValidP@ssword123' }));
    expect(res.status).toBe(500);
  });
});
