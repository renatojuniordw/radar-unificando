import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  pipelineRunRepository: { create: vi.fn(), findById: vi.fn(), update: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: { on: vi.fn(), emit: vi.fn(), removeAll: vi.fn() },
}));
vi.mock('@/lib/infrastructure/security/rate-limiter', () => ({
  pipelineLimiter: { check: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/steps/gupy-step', () => ({ runGupyStep: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/core/pipeline/steps/inhire-step', () => ({ runInHireStep: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/core/pipeline/steps/discovery-step', () => ({ runDiscoveryStep: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/core/pipeline/steps/save-step', () => ({ runSaveStep: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/core/dedup', () => ({ dedupEngine: { mergeSources: vi.fn().mockReturnValue([]) } }));

import { auth } from '@/auth';
import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { pipelineLimiter } from '@/lib/infrastructure/security/rate-limiter';
import { POST as PipelinePOST } from '@/app/api/pipeline/route';
import { GET as PipelineGetRun } from '@/app/api/pipeline/[runId]/route';

function makeRequest(body: any = {}): NextRequest {
  return { json: async () => body } as any;
}

describe('Pipeline API', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /api/pipeline', () => {
    it('should_return_429_when_rate_limited', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineLimiter.check).mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 300_000 });
      const res = await PipelinePOST(makeRequest());
      expect(res.status).toBe(429);
    });

    it('should_return_run_id_on_successful_start', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineLimiter.check).mockReturnValue({ allowed: true, remaining: 0, resetAt: Date.now() + 300_000 });
      vi.mocked(pipelineRunRepository.create).mockResolvedValue({ id: 'run-123' } as any);
      const res = await PipelinePOST(makeRequest({ companies: ['CorpA'] }));
      const body = await res.json();
      expect(body).toHaveProperty('runId');
    });

    it('should_use_anonymous_user_when_not_logged_in', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      vi.mocked(pipelineLimiter.check).mockReturnValue({ allowed: true, remaining: 0, resetAt: Date.now() + 300_000 });
      vi.mocked(pipelineRunRepository.create).mockResolvedValue({ id: 'run-456', userId: 'anonymous' } as any);
      const res = await PipelinePOST(makeRequest({}));
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/pipeline/[runId]', () => {
    it('should_return_404_when_run_not_found', async () => {
      vi.mocked(pipelineRunRepository.findById).mockResolvedValue(null);
      const res = await PipelineGetRun({} as any, { params: Promise.resolve({ runId: 'missing' }) });
      expect(res.status).toBe(404);
    });

    it('should_return_run_when_found', async () => {
      vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ id: 'run-1', status: 'completed' } as any);
      const res = await PipelineGetRun({} as any, { params: Promise.resolve({ runId: 'run-1' }) });
      const body = await res.json();
      expect(body.id).toBe('run-1');
    });
  });
});
