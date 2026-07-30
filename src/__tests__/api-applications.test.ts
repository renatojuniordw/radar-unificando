import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  applicationRepository: {
    findByUserId: vi.fn(),
    findByIdAndUser: vi.fn(),
    findByUserAndJob: vi.fn(),
    create: vi.fn(),
    updateStage: vi.fn(),
    deleteByIdAndUser: vi.fn(),
  },
}));

vi.mock('@/lib/core/application/state-machine', () => ({
  canTransition: vi.fn(),
  InvalidStatusTransition: class extends Error {
    constructor(from: string, to: string) {
      super(`Transição inválida: ${from} → ${to}`);
      this.name = 'InvalidStatusTransition';
    }
  },
}));

import { auth } from '@/auth';
import { applicationRepository } from '@/lib/infrastructure/repositories';
import { canTransition } from '@/lib/core/application/state-machine';
import { GET, POST } from '@/app/api/applications/route';
import { PATCH, DELETE } from '@/app/api/applications/[id]/route';

function mockSession(userId = 'user-1') {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as any);
}

function mockNoSession() {
  vi.mocked(auth).mockResolvedValue(null);
}

describe('Applications API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/applications', () => {
    it('should_return_401_when_not_authenticated', async () => {
      mockNoSession();
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('should_return_applications_when_authenticated', async () => {
      mockSession();
      vi.mocked(applicationRepository.findByUserId).mockResolvedValue([{ id: 'app-1' }] as any);
      const res = await GET();
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
    });
  });

  describe('POST /api/applications', () => {
    it('should_return_401_when_not_authenticated', async () => {
      mockNoSession();
      const res = await POST({ json: async () => ({}) } as any);
      expect(res.status).toBe(401);
    });

    it('should_return_400_when_job_id_missing', async () => {
      mockSession();
      const res = await POST({ json: async () => ({}) } as any);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('jobId');
    });

    it('should_return_existing_application_if_already_exists', async () => {
      mockSession();
      vi.mocked(applicationRepository.findByUserAndJob).mockResolvedValue({ id: 'existing' } as any);
      const res = await POST({ json: async () => ({ jobId: 'job-1' }) } as any);
      const body = await res.json();
      expect(body.id).toBe('existing');
    });

    it('should_create_new_application_and_return_201', async () => {
      mockSession();
      vi.mocked(applicationRepository.findByUserAndJob).mockResolvedValue(null);
      vi.mocked(applicationRepository.create).mockResolvedValue({ id: 'new-app' } as any);
      const res = await POST({ json: async () => ({ jobId: 'job-1' }) } as any);
      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /api/applications/[id]', () => {
    it('should_return_401_when_not_authenticated', async () => {
      mockNoSession();
      const res = await PATCH({ json: async () => ({}) } as any, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(401);
    });

    it('should_return_400_when_stage_missing', async () => {
      mockSession();
      const res = await PATCH({ json: async () => ({}) } as any, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(400);
    });

    it('should_return_404_when_application_not_found', async () => {
      mockSession();
      vi.mocked(applicationRepository.findByIdAndUser).mockResolvedValue(null);
      const res = await PATCH({ json: async () => ({ stage: 'analyzed' }) } as any, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(404);
    });

    it('should_update_stage_when_transition_valid', async () => {
      mockSession();
      vi.mocked(applicationRepository.findByIdAndUser).mockResolvedValue({ id: '1', stage: 'discovered' } as any);
      vi.mocked(canTransition).mockReturnValue(true);
      vi.mocked(applicationRepository.updateStage).mockResolvedValue({ id: '1', stage: 'analyzed' } as any);
      const res = await PATCH({ json: async () => ({ stage: 'analyzed' }) } as any, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/applications/[id]', () => {
    it('should_return_401_when_not_authenticated', async () => {
      mockNoSession();
      const res = await DELETE({} as any, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(401);
    });

    it('should_delete_application_when_authenticated', async () => {
      mockSession();
      vi.mocked(applicationRepository.deleteByIdAndUser).mockResolvedValue();
      const res = await DELETE({} as any, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(200);
    });
  });
});
