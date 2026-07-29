import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { User, Profile } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { email: string; passwordHash: string; name?: string | null }): Promise<User>;
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
