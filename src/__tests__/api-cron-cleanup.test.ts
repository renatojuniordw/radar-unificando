import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const { runRetentionCleanupMock } = vi.hoisted(() => ({
  runRetentionCleanupMock: vi.fn(),
}));

vi.mock('@/lib/infrastructure/cleanup/retention-cleanup', () => ({
  runRetentionCleanup: runRetentionCleanupMock,
}));

import { GET } from '@/app/api/cron/cleanup/route';

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) headers['x-cron-secret'] = secret;
  return new NextRequest('http://localhost/api/cron/cleanup', { headers });
}

describe('GET /api/cron/cleanup (retenção LGPD item 3.7)', () => {
  const ORIGINAL_SECRET = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    runRetentionCleanupMock.mockResolvedValue({ deletedExpiredCache: 3, deletedInactiveChats: 2 });
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = ORIGINAL_SECRET;
  });

  it('should_return_503_when_cron_secret_is_not_configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeRequest('qualquer'));
    expect(res.status).toBe(503);
    expect(runRetentionCleanupMock).not.toHaveBeenCalled();
  });

  it('should_return_401_when_secret_is_wrong', async () => {
    process.env.CRON_SECRET = 'segredo-correto';
    const res = await GET(makeRequest('segredo-errado'));
    expect(res.status).toBe(401);
    expect(runRetentionCleanupMock).not.toHaveBeenCalled();
  });

  it('should_run_cleanup_and_return_counts_when_secret_matches', async () => {
    process.env.CRON_SECRET = 'segredo-correto';
    const res = await GET(makeRequest('segredo-correto'));
    expect(res.status).toBe(200);
    expect(runRetentionCleanupMock).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, deletedExpiredCache: 3, deletedInactiveChats: 2 });
  });

  it('should_return_500_with_generic_message_when_cleanup_fails', async () => {
    process.env.CRON_SECRET = 'segredo-correto';
    runRetentionCleanupMock.mockRejectedValue(new Error('DB down'));
    const res = await GET(makeRequest('segredo-correto'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Erro na rotina de retenção.');
    expect(body.error).not.toContain('DB down');
  });
});
