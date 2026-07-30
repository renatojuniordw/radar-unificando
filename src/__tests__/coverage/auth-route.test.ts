import { describe, it, expect, vi } from 'vitest';

vi.mock('@/auth', () => ({
  handlers: { GET: 'mock-get-handler', POST: 'mock-post-handler' },
}));

describe('NextAuth Route', () => {
  it('should_re_export_GET_and_POST_from_auth', async () => {
    const mod = await import('@/app/api/auth/[...nextauth]/route');
    expect(mod.GET).toBe('mock-get-handler');
    expect(mod.POST).toBe('mock-post-handler');
  });
});
