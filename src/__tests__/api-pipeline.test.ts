import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { auth: mockAuth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  pipelineRunRepository: { create: vi.fn(), findById: vi.fn(), update: vi.fn() },
}));
vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: { on: vi.fn(), emit: vi.fn(), removeAll: vi.fn() },
}));
vi.mock('@/lib/infrastructure/security/rate-limiter', () => ({
  pipelineLimiter: { check: vi.fn(), windowMs: 300_000 },
  pipelineAutoLimiter: { check: vi.fn(), windowMs: 300_000 },
}));
vi.mock('@/lib/core/pipeline/steps/gupy-step', () => ({
  runGupyStep: vi.fn().mockResolvedValue([]),
  shouldUseGupyMCP: vi.fn().mockReturnValue(false),
}));
vi.mock('@/lib/core/pipeline/steps/inhire-step', () => ({ runInHireStep: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/core/pipeline/steps/discovery-step', () => ({ runDiscoveryStep: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/core/pipeline/steps/save-step', () => ({ runSaveStep: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/core/dedup', () => ({ dedupEngine: { mergeSources: vi.fn().mockReturnValue([]) } }));

import { pipelineRunRepository } from '@/lib/infrastructure/repositories';
import { pipelineLimiter, pipelineAutoLimiter } from '@/lib/infrastructure/security/rate-limiter';
import { POST as PipelinePOST } from '@/app/api/pipeline/route';
import { GET as PipelineGetRun } from '@/app/api/pipeline/[runId]/route';

function makeRequest(body: any = {}): NextRequest {
  return { json: async () => body, headers: new Headers() } as any;
}

describe('Pipeline API', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /api/pipeline', () => {
    it('should_return_429_when_rate_limited', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineLimiter.check).mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 300_000, retryAfter: 300 });
      const res = await PipelinePOST(makeRequest());
      expect(res.status).toBe(429);
    });

    it('should_return_run_id_on_successful_start', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineLimiter.check).mockReturnValue({ allowed: true, remaining: 0, resetAt: Date.now() + 300_000, retryAfter: 0 });
      vi.mocked(pipelineRunRepository.create).mockResolvedValue({ id: 'run-123' } as any);
      const res = await PipelinePOST(makeRequest({ companies: ['CorpA'] }));
      const body = await res.json();
      expect(body).toHaveProperty('runId');
    });

    it('should_use_anonymous_user_when_not_logged_in', async () => {
      mockAuth.mockResolvedValue(null);
      vi.mocked(pipelineLimiter.check).mockReturnValue({ allowed: true, remaining: 0, resetAt: Date.now() + 300_000, retryAfter: 0 });
      vi.mocked(pipelineRunRepository.create).mockResolvedValue({ id: 'run-456', userId: '00000000-0000-0000-0000-000000000000' } as any);
      const res = await PipelinePOST(makeRequest({}));
      expect(res.status).toBe(200);
    });

    it('should_not_consume_manual_slot_on_auto_sync', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineAutoLimiter.check).mockReturnValue({ allowed: true, remaining: 1, resetAt: Date.now() + 300_000, retryAfter: 0 });
      vi.mocked(pipelineRunRepository.create).mockResolvedValue({ id: 'run-auto' } as any);
      const res = await PipelinePOST(makeRequest({ auto: true }));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.cooldownSeconds).toBe(0);
      expect(pipelineLimiter.check).not.toHaveBeenCalled();
    });

    it('should_return_429_when_auto_sync_rate_limited', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineAutoLimiter.check).mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 300_000, retryAfter: 300 });
      const res = await PipelinePOST(makeRequest({ auto: true }));
      expect(res.status).toBe(429);
      expect(pipelineLimiter.check).not.toHaveBeenCalled();
    });

    it('should_apply_manual_cooldown_when_not_auto', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineLimiter.check).mockReturnValue({ allowed: true, remaining: 0, resetAt: Date.now() + 300_000, retryAfter: 0 });
      vi.mocked(pipelineRunRepository.create).mockResolvedValue({ id: 'run-manual' } as any);
      const res = await PipelinePOST(makeRequest({ auto: false }));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.cooldownSeconds).toBe(300);
    });
  });

  describe('GET /api/pipeline/[runId]', () => {
    it('should_return_401_when_not_authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const res = await PipelineGetRun({} as any, { params: Promise.resolve({ runId: 'run-1' }) });
      expect(res.status).toBe(401);
    });

    it('should_return_404_when_run_not_found', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineRunRepository.findById).mockResolvedValue(null);
      const res = await PipelineGetRun({} as any, { params: Promise.resolve({ runId: 'missing' }) });
      expect(res.status).toBe(404);
    });

    it('should_return_run_when_found', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ id: 'run-1', status: 'completed', userId: 'user-1' } as any);
      const res = await PipelineGetRun({} as any, { params: Promise.resolve({ runId: 'run-1' }) });
      const body = await res.json();
      expect(body.id).toBe('run-1');
    });

    it('should_return_404_when_run_belongs_to_another_user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      vi.mocked(pipelineRunRepository.findById).mockResolvedValue({ id: 'run-1', status: 'completed', userId: 'other-user' } as any);
      const res = await PipelineGetRun({} as any, { params: Promise.resolve({ runId: 'run-1' }) });
      expect(res.status).toBe(404);
    });
  });
});