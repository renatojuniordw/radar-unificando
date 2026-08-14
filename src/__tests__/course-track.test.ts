import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: { courseClick: { create: vi.fn() } },
}));

import { prisma } from '@/lib/infrastructure/db/prisma-client';
import { recordCourseClick } from '@/lib/core/courses/course-track';

const mockedCreate = vi.mocked(prisma.courseClick.create);

describe('recordCourseClick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registra_clique_com_todos_os_campos', async () => {
    mockedCreate.mockResolvedValue({ id: 'cc-1' } as any);

    await recordCourseClick({
      userId: 'u1',
      courseId: 'udemy-python',
      skill: 'python',
      platform: 'udemy',
      origin: 'course-card',
      url: 'https://www.udemy.com/course/python/',
      ipHash: 'abc123',
    });

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        courseId: 'udemy-python',
        skill: 'python',
        platform: 'udemy',
        origin: 'course-card',
        url: 'https://www.udemy.com/course/python/',
        ipHash: 'abc123',
      },
    });
  });

  it('usa_null_para_campos_opcionais_ausentes', async () => {
    mockedCreate.mockResolvedValue({ id: 'cc-2' } as any);

    await recordCourseClick({ courseId: 'alura-java', origin: 'sidebar' });

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        userId: null,
        courseId: 'alura-java',
        skill: null,
        platform: null,
        origin: 'sidebar',
        url: null,
        ipHash: null,
      },
    });
  });

  it('nao_derruba_a_navegacao_quando_o_prisma_falha', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedCreate.mockRejectedValue(new Error('db down'));

    await expect(recordCourseClick({ courseId: 'x', origin: 'y' })).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith('[course-click] Erro ao registrar clique:', expect.any(Error));
    errorSpy.mockRestore();
  });
});
