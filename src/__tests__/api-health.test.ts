import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: { $queryRaw: vi.fn() },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_200_when_db_connected', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '1': 1 }]);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
  });

  it('should_return_503_when_db_disconnected', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.status).toBe('error');
    expect(body.db).toBe('disconnected');
  });
});
