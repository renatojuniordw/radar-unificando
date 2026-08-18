import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    profile: { findFirst: vi.fn(), upsert: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { userRepository, profileRepository } from '@/lib/infrastructure/repositories/user-repository';

const user = vi.mocked(prisma.user);
const profile = vi.mocked(prisma.profile);

describe('userRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findByEmail_normaliza_email_para_minusculas', async () => {
    user.findFirst.mockResolvedValue({ id: 'u1', email: 'foo@bar.com' } as any);
    const result = await userRepository.findByEmail('FOO@BAR.COM');
    expect(result?.email).toBe('foo@bar.com');
    expect(user.findFirst).toHaveBeenCalledWith({ where: { email: 'foo@bar.com' } });
  });

  it('findById_retorna_usuario_ou_null', async () => {
    user.findUnique.mockResolvedValue({ id: 'u1' } as any);
    expect((await userRepository.findById('u1'))?.id).toBe('u1');
    user.findUnique.mockResolvedValue(null);
    expect(await userRepository.findById('x')).toBeNull();
  });

  it('create_persiste_email_normalizado', async () => {
    user.create.mockResolvedValue({ id: 'u1' } as any);
    await userRepository.create({ email: 'Foo@Bar.com', passwordHash: 'hash' });
    expect(user.create).toHaveBeenCalledWith({ data: { email: 'foo@bar.com', passwordHash: 'hash' } });
  });

  it('updateLastLogin_atualiza_timestamp', async () => {
    user.update.mockResolvedValue({} as any);
    await userRepository.updateLastLogin('u1');
    expect(user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { lastLoginAt: expect.any(Date) },
    });
  });
});

describe('profileRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('findByUserId_retorna_perfil_ou_null', async () => {
    profile.findFirst.mockResolvedValue({ userId: 'u1', skills: [] } as any);
    expect((await profileRepository.findByUserId('u1'))?.userId).toBe('u1');
    profile.findFirst.mockResolvedValue(null);
    expect(await profileRepository.findByUserId('u1')).toBeNull();
  });

  it('upsert_cria_ou_atualiza_perfil', async () => {
    profile.upsert.mockResolvedValue({} as any);
    await profileRepository.upsert('u1', { skills: ['Python'] } as any);
    expect(profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      create: { userId: 'u1', skills: ['Python'] },
      update: { skills: ['Python'] },
    });
  });

  it('findUserIdsByResumeHash_retorna_exclude_sem_hash', async () => {
    const ids = await profileRepository.findUserIdsByResumeHash(null, 'u1');
    expect(ids).toEqual(['u1']);
    expect(profile.findMany).not.toHaveBeenCalled();
  });

  it('findUserIdsByResumeHash_fallback_para_exclude_quando_sem_match', async () => {
    profile.findMany.mockResolvedValue([] as any);
    const ids = await profileRepository.findUserIdsByResumeHash('abc', 'u1');
    expect(ids).toEqual(['u1']);
  });
});
