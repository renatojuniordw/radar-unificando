import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    profile: { findFirst: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
    chatMessage: { deleteMany: vi.fn() },
    chatUsage: { deleteMany: vi.fn() },
    chat: { deleteMany: vi.fn() },
    generatedContentCache: { deleteMany: vi.fn() },
    applicationLog: { deleteMany: vi.fn() },
    application: { deleteMany: vi.fn() },
    pipelineRun: { deleteMany: vi.fn() },
    companyPresence: { deleteMany: vi.fn() },
    job: { deleteMany: vi.fn() },
    newCompany: { deleteMany: vi.fn() },
    extensionToken: { deleteMany: vi.fn() },
    extensionFeedback: { deleteMany: vi.fn() },
    courseClick: { deleteMany: vi.fn() },
    session: { deleteMany: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.resolve(ops)),
  },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { userRepository, profileRepository } from '@/lib/infrastructure/repositories/user-repository';

const user = vi.mocked(prisma.user);
const profile = vi.mocked(prisma.profile);

describe('userRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_normalize_email_to_lowercase_on_find_by_email', async () => {
    user.findFirst.mockResolvedValue({ id: 'u1', email: 'foo@bar.com' } as any);
    const result = await userRepository.findByEmail('FOO@BAR.COM');
    expect(result?.email).toBe('foo@bar.com');
    expect(user.findFirst).toHaveBeenCalledWith({ where: { email: 'foo@bar.com' } });
  });

  it('should_return_user_or_null_by_id', async () => {
    user.findUnique.mockResolvedValue({ id: 'u1' } as any);
    expect((await userRepository.findById('u1'))?.id).toBe('u1');
    user.findUnique.mockResolvedValue(null);
    expect(await userRepository.findById('x')).toBeNull();
  });

  it('should_create_user_with_normalized_email', async () => {
    user.create.mockResolvedValue({ id: 'u1' } as any);
    await userRepository.create({ email: 'Foo@Bar.com', passwordHash: 'hash' });
    expect(user.create).toHaveBeenCalledWith({ data: { email: 'foo@bar.com', passwordHash: 'hash' } });
  });

  it('should_update_last_login_timestamp', async () => {
    user.update.mockResolvedValue({} as any);
    await userRepository.updateLastLogin('u1');
    expect(user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { lastLoginAt: expect.any(Date) },
    });
  });

  it('should_find_user_by_reset_token_hash', async () => {
    user.findFirst.mockResolvedValue({ id: 'u1' } as any);
    await userRepository.findByResetTokenHash('hash');
    expect(user.findFirst).toHaveBeenCalledWith({ where: { resetTokenHash: 'hash' } });
  });

  it('should_set_reset_token_with_expiry', async () => {
    user.update.mockResolvedValue({} as any);
    const expiresAt = new Date('2026-08-19');
    await userRepository.setResetToken('u1', 'hash', expiresAt);
    expect(user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { resetTokenHash: 'hash', resetTokenExpiresAt: expiresAt },
    });
  });

  it('should_update_password_and_clear_reset_token', async () => {
    user.update.mockResolvedValue({} as any);
    await userRepository.updatePassword('u1', 'new-hash');
    expect(user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { passwordHash: 'new-hash', resetTokenHash: null, resetTokenExpiresAt: null },
    });
  });

  it('should_delete_all_user_data_in_transaction', async () => {
    await userRepository.deleteAllUserData('u1');
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
    const ops = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown as unknown[];
    expect(ops.length).toBeGreaterThanOrEqual(13);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});

describe('profileRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should_return_profile_or_null_by_user_id', async () => {
    profile.findFirst.mockResolvedValue({ userId: 'u1', skills: [] } as any);
    expect((await profileRepository.findByUserId('u1'))?.userId).toBe('u1');
    profile.findFirst.mockResolvedValue(null);
    expect(await profileRepository.findByUserId('u1')).toBeNull();
  });

  it('should_upsert_profile_creating_or_updating', async () => {
    profile.upsert.mockResolvedValue({} as any);
    await profileRepository.upsert('u1', { skills: ['Python'] } as any);
    expect(profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      create: { userId: 'u1', skills: ['Python'] },
      update: { skills: ['Python'] },
    });
  });

  it('should_return_exclude_user_when_no_resume_hash', async () => {
    const ids = await profileRepository.findUserIdsByResumeHash(null, 'u1');
    expect(ids).toEqual(['u1']);
    expect(profile.findMany).not.toHaveBeenCalled();
  });

  it('should_fall_back_to_exclude_user_when_no_hash_match', async () => {
    profile.findMany.mockResolvedValue([] as any);
    const ids = await profileRepository.findUserIdsByResumeHash('abc', 'u1');
    expect(ids).toEqual(['u1']);
  });

  it('should_return_matching_user_ids_when_hash_found', async () => {
    profile.findMany.mockResolvedValue([{ userId: 'u2' }, { userId: 'u3' }] as any);
    const ids = await profileRepository.findUserIdsByResumeHash('abc', 'u1');
    expect(ids).toEqual(['u2', 'u3']);
  });
});
