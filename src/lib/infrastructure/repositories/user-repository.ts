import { prisma } from '@/lib/infrastructure/db/prisma-client';
import type { User, Profile } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { email: string; passwordHash: string; name?: string | null }): Promise<User>;
  updateLastLogin(userId: string): Promise<void>;
  findByResetTokenHash(hash: string): Promise<User | null>;
  setResetToken(userId: string, hash: string, expiresAt: Date): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  deleteAllUserData(userId: string): Promise<void>;
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
  async updateLastLogin(userId) {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
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
  async deleteAllUserData(userId) {
    // Exclui todos os dados do usuário em cascata via transação.
    // A ordem respeita as dependências de foreign key do schema Prisma.
    await prisma.$transaction([
      // 1. Dados derivados de chat (mensagens e uso)
      prisma.chatMessage.deleteMany({ where: { chat: { userId } } }),
      prisma.chatUsage.deleteMany({ where: { userId } }),
      prisma.chat.deleteMany({ where: { userId } }),
      // 2. Conteúdo gerado por IA
      prisma.generatedContentCache.deleteMany({ where: { userId } }),
      // 3. Pipeline e candidaturas
      prisma.applicationLog.deleteMany({ where: { userId } }),
      prisma.application.deleteMany({ where: { userId } }),
      prisma.pipelineRun.deleteMany({ where: { userId } }),
      prisma.companyPresence.deleteMany({ where: { userId } }),
      // 4. Vagas e empresas
      prisma.job.deleteMany({ where: { userId } }),
      prisma.newCompany.deleteMany({ where: { userId } }),
      // 5. Extensão e feedback
      prisma.extensionToken.deleteMany({ where: { userId } }),
      prisma.extensionFeedback.deleteMany({ where: { userId } }),
      prisma.courseClick.deleteMany({ where: { userId } }),
      // 6. Perfil
      prisma.profile.deleteMany({ where: { userId } }),
      // 7. Conta do usuário (último, por ser referenciada por tudo)
      prisma.user.delete({ where: { id: userId } }),
    ]);
  },
};

type ProfileUpsertData = Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>;

export interface IProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>;
  upsert(userId: string, data: ProfileUpsertData): Promise<void>;
  findUserIdsByResumeHash(resumeHash: string | null, excludeUserId: string): Promise<string[]>;
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
  async findUserIdsByResumeHash(resumeHash, excludeUserId) {
    if (!resumeHash) return [excludeUserId];
    const profiles = await prisma.profile.findMany({
      where: { resumeHash },
      select: { userId: true },
    });
    const ids = profiles.map((p) => p.userId);
    return ids.length > 0 ? ids : [excludeUserId];
  },
};
