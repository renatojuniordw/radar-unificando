// Domínio de cursos de afiliados. Catálogo atual é 100% Udemy — Alura fica
// suportada pelo tipo CourseProviderId mas sem entradas até a afiliação ser
// aprovada. A interface CourseProvider permite plugar fontes dinâmicas
// (ex.: busca avulsa via API da Impact, ver impact-client.ts).
// Hoje a implementação padrão é o catálogo curado local (CuratedCatalogProvider).

import { COURSES } from './course-catalog';
import { expandTokens } from './course-matcher';
import { removeAccents } from '@/lib/utils/string';

export type CourseProviderId = 'alura' | 'udemy';

export interface Course {
  id: string;
  provider: CourseProviderId;
  title: string;
  description: string;
  /** Termos usados no matching determinístico (ex.: ['python', 'dados']) */
  skillTags: string[];
  /** Rótulo de preço exibido no card (ex.: "R$ 39,90" | "Assinatura a partir de R$ 99/mês") */
  priceLabel: string;
  /** Avaliação exibida no card (ex.: "4.8") */
  rating?: string;
  /** URL base do curso. Para Udemy, o tracking ?ref= é adicionado por buildAffiliateUrl. */
  url: string;
  /** Destaque usado no fallback (sem termos de busca) */
  featured?: boolean;
}

export interface CourseProvider {
  listCourses(): Promise<Course[]>;
  searchCourses(query: string): Promise<Course[]>;
}

/**
 * Adiciona o parâmetro de tracking de afiliado aos links da Udemy.
 * Alura usa URL fixa de afiliado (Awin) — retorna como está.
 */
export function buildAffiliateUrl(course: Course): string {
  if (course.provider !== 'udemy') return course.url;
  const ref = process.env.NEXT_PUBLIC_UDEMY_AFFILIATE_REF;
  if (!ref) return course.url;
  const separator = course.url.includes('?') ? '&' : '?';
  return `${course.url}${separator}ref=${encodeURIComponent(ref)}`;
}

class CuratedCatalogProvider implements CourseProvider {
  async listCourses(): Promise<Course[]> {
    return COURSES;
  }

  async searchCourses(query: string): Promise<Course[]> {
    const tokens = expandTokens(
      removeAccents(query)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1),
    );

    if (tokens.length === 0) return COURSES;

    const scored = COURSES.map((course) => {
      const haystack = new Set(
        expandTokens(
          removeAccents([...course.skillTags, course.title].join(' '))
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((t) => t.length > 1),
        ),
      );
      const match = tokens.filter((t) => haystack.has(t)).length;
      return { course, match };
    })
      .filter((s) => s.match > 0)
      .sort((a, b) => b.match - a.match);

    return scored.map((s) => s.course);
  }
}

const curatedCatalogProvider = new CuratedCatalogProvider();

export function getCourseProvider(): CourseProvider {
  // Futuro: trocar por UdemyApiProvider quando a chave de afiliado for aprovada.
  return curatedCatalogProvider;
}