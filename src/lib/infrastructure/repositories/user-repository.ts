import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { User, Profile } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { email: string; passwordHash: string; name?: string | null }): Promise<User>;
  findByResetTokenHash(hash: string): Promise<User | null>;
  setResetToken(userId: string, hash: string, expiresAt: Date): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

export const userRepository: IUserRepository = {
  async findByEmail(email) {
    return prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  },
  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },
  async create(data) {
    return prisma.user.create({ data: { ...data, email: data.email.toLowerCase() } });
  },
  async findByResetTokenHash(hash) {
    return prisma.user.findFirst({ where: { resetTokenHash: hash } });
  },
  async setResetToken(userId, hash, expiresAt) {
    await prisma.user.update({
      where: { id: userId },
      data: { resetTokenHash: hash, resetTokenExpiresAt: expiresAt },
    });
  },
  async updatePassword(userId, passwordHash) {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
    });
  },
};

type ProfileUpsertData = Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>;

export interface IProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>;
  upsert(userId: string, data: ProfileUpsertData): Promise<void>;
}

export const profileRepository: IProfileRepository = {
  async findByUserId(userId) {
    return prisma.profile.findFirst({ where: { userId } });
  },
  async upsert(userId, data) {
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};
