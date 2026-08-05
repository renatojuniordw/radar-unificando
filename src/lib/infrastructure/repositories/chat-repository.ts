import { prisma } from '@/lib/infrastructure/db/prisma-client';

export interface ChatMessageData {
  id: string;
  role: string;
  [key: string]: unknown;
}

export interface ChatSummary {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: Date;
}

export interface IChatRepository {
  getMessages(userId: string, externalId: string): Promise<ChatMessageData[]>;
  replaceMessages(userId: string, externalId: string, messages: ChatMessageData[]): Promise<void>;
  deleteChat(userId: string, externalId: string): Promise<void>;
  listChats(userId: string): Promise<ChatSummary[]>;
  getDailyUserMessageCount(userId: string): Promise<number>;
}

function extractText(content: unknown): string {
  const message = content as { parts?: Array<{ type: string; text?: string }> };
  return (message.parts || [])
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join(' ');
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
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const inferredTitle = firstUserMsg ? extractText(firstUserMsg).trim().slice(0, 40) : null;

    const chat = await prisma.chat.upsert({
      where: { userId_externalId: { userId, externalId } },
      create: { userId, externalId, title: inferredTitle },
      update: { updatedAt: new Date() },
    });

    if (inferredTitle && !chat.title) {
      await prisma.chat.update({
        where: { id: chat.id },
        data: { title: inferredTitle },
      });
    }

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

  async listChats(userId) {
    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { position: 'desc' }, take: 1 } },
    });

    return chats
      .filter((chat) => chat.messages.length > 0)
      .map((chat) => {
        const lastMessage = extractText(chat.messages[0].content);
        return {
          id: chat.externalId,
          title: chat.title || lastMessage.slice(0, 40) || 'Conversa',
          lastMessage: lastMessage.slice(0, 80),
          createdAt: chat.createdAt,
        };
      });
  },

  async getDailyUserMessageCount(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return prisma.chatMessage.count({
      where: {
        chat: { userId },
        role: 'user',
        createdAt: { gte: startOfDay },
      },
    });
  },
};
