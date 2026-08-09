import { describe, it, expect, vi, beforeEach } from 'vitest';

const { findUserIdByExtensionToken: mockFindUser } = vi.hoisted(() => ({
  findUserIdByExtensionToken: vi.fn(),
}));

vi.mock('@/lib/core/extension/extension-token', () => ({
  findUserIdByExtensionToken: mockFindUser,
}));
vi.mock('@/lib/core/extension/extension-feedback', () => ({
  recordFeedback: vi.fn(),
}));
vi.mock('@/lib/infrastructure/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

import { recordFeedback } from '@/lib/core/extension/extension-feedback';
import { checkRateLimit } from '@/lib/infrastructure/rate-limit';
import { POST } from '@/app/api/extension/feedback/route';

function makeRequest(auth?: string, body: unknown = {}) {
  const headers = new Headers();
  if (auth) headers.set('authorization', auth);
  return { json: async () => body, headers } as any;
}

describe('Extension Feedback API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_return_401_when_no_bearer_token', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('should_return_401_when_token_invalid', async () => {
    mockFindUser.mockResolvedValue(null);
    const res = await POST(makeRequest('Bearer invalid-token'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain('inválido');
  });

  it('should_return_400_when_rating_not_boolean', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);

    const res = await POST(makeRequest('Bearer valid-token', { rating: 'yes' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('booleano');
  });

  it('should_return_429_when_rate_limited', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      msBeforeNext: 30000,
      remainingPoints: 0,
    } as any);

    const res = await POST(makeRequest('Bearer valid-token', { rating: true }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('should_record_feedback_on_success', async () => {
    mockFindUser.mockResolvedValue('user-1');
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any);

    const res = await POST(makeRequest('Bearer valid-token', { rating: true, comment: 'Muito útil' }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(recordFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      rating: true,
      comment: 'Muito útil',
    });
  });
});