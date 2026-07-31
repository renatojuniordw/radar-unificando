import { prisma } from '@/lib/infrastructure/db/prisma-client';

export interface ChatMessageData {
  id: string;
  role: string;
  [key: string]: unknown;
}

export interface IChatRepository {
  getMessages(userId: string, externalId: string): Promise<ChatMessageData[]>;
  replaceMessages(userId: string, externalId: string, messages: ChatMessageData[]): Promise<void>;
  deleteChat(userId: string, externalId: string): Promise<void>;
}

export const chatRepository: IChatRepository = {
  async getMessages(userId, externalId) {
    const chat = await prisma.chat.findUnique({
      where: { userId_externalId: { userId, externalId } },
      include: { messages: { orderBy: { position: 'asc' } } },
    });
    if (!chat) return [];
    return chat.messages.map((m) => m.content as unknown as ChatMessageData);
  },

  async replaceMessages(userId, externalId, messages) {
    const chat = await prisma.chat.upsert({
      where: { userId_externalId: { userId, externalId } },
      create: { userId, externalId },
      update: { updatedAt: new Date() },
    });

    await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { chatId: chat.id } }),
      prisma.chatMessage.createMany({
        data: messages.map((message, index) => ({
          chatId: chat.id,
          position: index,
          role: message.role,
          content: message as object,
        })),
      }),
    ]);
  },

  async deleteChat(userId, externalId) {
    await prisma.chat.deleteMany({ where: { userId, externalId } });
  },
};
