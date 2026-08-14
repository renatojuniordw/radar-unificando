import type { Job } from '@/types';
import { removeAccents } from '@/lib/utils/string';

/**
 * Marcadores de design físico (moda, industrial, etc.) que NÃO correspondem a
 * design de produto digital/UX. A busca por substring da Gupy (jobName) retorna
 * falsos positivos — ex.: "designer de produto" traz vagas de estamparia/moda.
 * Uma vaga só é descartada se o marcador aparecer no título E nenhuma query
 * buscar explicitamente aquele domínio (ex.: "designer industrial" mantém vagas
 * com "industrial" no título).
 */
const PHYSICAL_DESIGN_MARKERS = [
  'estamparia', 'estampa', 'moda', 'textil', 'vestuario', 'roupas',
  'calcado', 'calcados', 'sapato', 'sapatos', 'joias', 'joalheria',
  'acessorios', 'bolsas', 'industrial', 'automotivo', 'mecanica',
  'mobiliario', 'interiores', 'embalagem', 'superficie', 'embarcacoes',
  'automovel',
];

const DESIGN_QUERY_RE = /\b(designer|design|ux|ui|produto)\b/;

function normalize(text: string): string {
  return ' ' + removeAccents(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
}

/** True quando ao menos uma query busca design (digital/UX/produto). */
export function isDesignSearch(queries: string[]): boolean {
  return queries.some(q => DESIGN_QUERY_RE.test(normalize(q)));
}

/** True quando o título indica design físico cujo domínio não foi buscado. */
export function isOffTopicPhysicalDesign(title: string, queries: string[]): boolean {
  const t = normalize(title);
  if (!t.trim()) return false;
  const normalizedQueries = queries.map(normalize);
  return PHYSICAL_DESIGN_MARKERS.some(marker =>
    t.includes(marker) && !normalizedQueries.some(q => q.includes(marker)),
  );
}

/**
 * Descarta vagas de design físico (moda/industrial/etc.) que a busca por
 * substring da Gupy retorna como falso positivo. Só atua quando a busca é de
 * design e o domínio do marcador não foi explicitamente buscado.
 */
export function filterIrrelevantDesignJobs(jobs: Job[], queries: string[]): Job[] {
  if (!isDesignSearch(queries)) return jobs;
  return jobs.filter(job => !isOffTopicPhysicalDesign(job.title, queries));
}