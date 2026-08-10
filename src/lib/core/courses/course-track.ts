import { prisma } from '@/lib/infrastructure/db/prisma-client';

export interface CourseClickData {
  userId?: string | null;
  courseId: string;
  skill?: string | null;
  platform?: string | null;
  origin: string;
  url?: string | null;
  ipHash?: string | null;
}

/** Registra um clique em link de curso de afiliado (Alura/Udemy). */
export async function recordCourseClick(data: CourseClickData): Promise<void> {
  try {
    await prisma.courseClick.create({
      data: {
        userId: data.userId ?? null,
        courseId: data.courseId,
        skill: data.skill ?? null,
        platform: data.platform ?? null,
        origin: data.origin,
        url: data.url ?? null,
        ipHash: data.ipHash ?? null,
      },
    });
  } catch (error) {
    // Analytics não pode derrubar a navegação do usuário.
    console.error('[course-click] Erro ao registrar clique:', error);
  }
}
