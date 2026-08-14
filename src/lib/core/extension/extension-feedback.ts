import { prisma } from '@/lib/infrastructure/db/prisma-client';

export interface RecordFeedbackInput {
  userId: string;
  rating: boolean; // true = útil, false = não útil
  comment?: string;
}

/** Registra o feedback de utilidade enviado pela extensão. */
export async function recordFeedback(input: RecordFeedbackInput): Promise<void> {
  await prisma.extensionFeedback.create({
    data: {
      userId: input.userId,
      rating: input.rating,
      comment: input.comment?.trim() ? input.comment.trim().slice(0, 1000) : null,
    },
  });
}