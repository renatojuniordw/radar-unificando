import { describe, it, expect, vi, beforeEach } from 'vitest';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/core/extension/extension-token', () => ({
  getExtensionStatusForUser: vi.fn(),
}));

import { getExtensionStatusForUser } from '@/lib/core/extension/extension-token';
import { GET } from '@/app/api/extensao/status/route';

describe('Extensao Status API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
  });

  it('should_return_401_when_not_authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect((await res.json()).connected).toBe(false);
  });

  it('should_return_extension_status', async () => {
    vi.mocked(getExtensionStatusForUser).mockResolvedValue({ connected: true, token: 'abc' } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ connected: true, token: 'abc' });
    expect(getExtensionStatusForUser).toHaveBeenCalledWith('user-1');
  });

  it('should_return_500_when_status_lookup_fails', async () => {
    vi.mocked(getExtensionStatusForUser).mockRejectedValue(new Error('db down'));
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).connected).toBe(false);
  });
});