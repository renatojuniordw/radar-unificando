import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mapImpactItemToCourse,
  searchUdemyCourses,
} from '@/lib/core/courses/impact-client';

describe('mapImpactItemToCourse', () => {
  it('deve_mapear_item_do_impact_para_course', () => {
    const course = mapImpactItemToCourse(
      {
        ItemSID: '1234',
        Name: 'Python do Zero ao Avançado',
        Description: 'Curso completo de Python.',
        Price: 29.9,
        Rating: 4.7,
        RatingCount: 1200,
        Url: 'https://www.udemy.com/course/python-do-zero',
      },
      'python',
    );

    expect(course).not.toBeNull();
    expect(course!.id).toBe('impact-udemy-1234');
    expect(course!.provider).toBe('udemy');
    expect(course!.title).toBe('Python do Zero ao Avançado');
    expect(course!.priceLabel).toBe('R$ 29,90');
    expect(course!.rating).toBe('4.7 (1200)');
    expect(course!.url).toBe('https://www.udemy.com/course/python-do-zero');
    expect(course!.skillTags).toEqual(['python']);
  });

  it('deve_retornar_null_para_item_sem_url_ou_titulo', () => {
    expect(mapImpactItemToCourse({ ItemSID: '1' }, 'python')).toBeNull();
    expect(mapImpactItemToCourse({ Url: 'https://x' }, 'python')).toBeNull();
  });
});

describe('searchUdemyCourses (fail-open)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('deve_retornar_vazio_sem_chaves_configuradas', async () => {
    vi.stubEnv('IMPACT_ACCOUNT_SID', '');
    vi.stubEnv('IMPACT_AUTH_TOKEN', '');
    await expect(searchUdemyCourses('python', 5)).resolves.toEqual([]);
  });
});
