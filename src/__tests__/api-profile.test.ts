import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: vi.fn(), upsert: vi.fn() },
}));

import { auth } from '@/auth';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { GET, PUT } from '@/app/api/profile/route';

describe('Profile API', () => {
  beforeEach(() => vi.clearAllMocks());

  function mockSession() { vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any); }

  describe('GET /api/profile', () => {
    it('should_return_401_when_not_authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      expect((await GET()).status).toBe(401);
    });

    it('should_return_profile_when_exists', async () => {
      mockSession();
      vi.mocked(profileRepository.findByUserId).mockResolvedValue({ skills: ['python'] } as any);
      const body = await (await GET()).json();
      expect(body.skills).toContain('python');
    });

    it('should_return_null_when_profile_not_found', async () => {
      mockSession();
      vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
      const body = await (await GET()).json();
      expect(body).toBeNull();
    });
  });

  describe('PUT /api/profile', () => {
    it('should_return_401_when_not_authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      expect((await PUT({ json: async () => ({}) } as any)).status).toBe(401);
    });

    it('should_upsert_profile_with_new_columns', async () => {
      mockSession();
      vi.mocked(profileRepository.upsert).mockResolvedValue();
      const res = await PUT({ json: async () => ({
        skills: ['python', 'sql'],
        experienceYears: 5,
        seniority: 'senior',
        currentRole: 'Data Engineer',
        area: 'Dados',
        education: ['Computer Science'],
      }) } as any);
      expect(res.status).toBe(200);

      const upsertCall = vi.mocked(profileRepository.upsert).mock.calls[0];
      expect(upsertCall[1]).toMatchObject({
        skills: ['python', 'sql'],
        experienceYears: 5,
        seniority: 'senior',
        currentRole: 'Data Engineer',
        area: 'Dados',
        education: ['Computer Science'],
      });
      expect(upsertCall[1]).not.toHaveProperty('parsedData');
    });

    it('should_not_clobber_other_fields_on_update', async () => {
      mockSession();
      vi.mocked(profileRepository.upsert).mockResolvedValue();

      await PUT({ json: async () => ({
        skills: ['python'],
        currentRole: 'Data Engineer',
        area: 'Dados',
      }) } as any);

      const upsertCall = vi.mocked(profileRepository.upsert).mock.calls[0];
      expect(upsertCall[1]).toMatchObject({
        skills: ['python'],
        currentRole: 'Data Engineer',
        area: 'Dados',
      });
    });
  });
});
