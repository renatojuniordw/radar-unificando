// Cliente da API Impact Radius (Udemy Affiliate) — server-side apenas.
// O token é secreto (IMPACT_AUTH_TOKEN); todo acesso à API acontece aqui.
// Fail-open: qualquer falha retorna [] para nunca derrubar a UX.

import type { Course } from './course-provider';

const IMPACT_BASE = 'https://api.impact.com';
const TIMEOUT_MS = 6000;

interface ImpactItem {
  id?: string;
  ItemSID?: string;
  Name?: string;
  Title?: string;
  Description?: string;
  Price?: number;
  PriceString?: string;
  Rating?: number;
  RatingCount?: number;
  Url?: string;
  [key: string]: unknown;
}

export function isConfigured(): boolean {
  return Boolean(
    process.env.IMPACT_ACCOUNT_SID && process.env.IMPACT_AUTH_TOKEN,
  );
}

function authHeader(): string {
  const sid = process.env.IMPACT_ACCOUNT_SID || '';
  const token = process.env.IMPACT_AUTH_TOKEN || '';
  return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

async function impactFetch(path: string): Promise<unknown> {
  const res = await fetch(`${IMPACT_BASE}${path}`, {
    headers: { Authorization: authHeader() },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Impact API ${res.status} para ${path}`);
  }
  return res.json();
}

let cachedCatalogId: string | null = null;

/** Id do catálogo da Udemy: override por env ou auto-descoberto (cache em memória). */
export async function getUdemyCatalogId(): Promise<string | null> {
  if (process.env.IMPACT_UDEMY_CATALOG_ID) {
    return process.env.IMPACT_UDEMY_CATALOG_ID;
  }
  if (cachedCatalogId) return cachedCatalogId;
  if (!isConfigured()) return null;

  try {
    const data = (await impactFetch(
      `/Mediapartners/${process.env.IMPACT_ACCOUNT_SID}/Catalogs`,
    )) as { Catalogs?: Array<{ Id?: string; Name?: string }> };

    const udemy = (data?.Catalogs || []).find((c) =>
      (c.Name || '').toLowerCase().includes('udemy'),
    );
    cachedCatalogId = udemy?.Id || null;
    return cachedCatalogId;
  } catch (error) {
    console.error('[impact] Erro ao descobrir catálogo Udemy:', error);
    return null;
  }
}

/**
 * Mapeia um item do ItemSearch para o shape Course do Radar.
 * Export puro — testável com fixture.
 */
export function mapImpactItemToCourse(item: ImpactItem, query: string): Course | null {
  const id = String(item.ItemSID ?? item.id ?? '');
  const title = String(item.Name ?? item.Title ?? '').trim();
  const url = String(item.Url ?? '').trim();
  if (!id || !title || !url) return null;

  const price = typeof item.Price === 'number' ? item.Price : undefined;
  const rating = typeof item.Rating === 'number' ? item.Rating : undefined;
  const ratingCount = typeof item.RatingCount === 'number' ? item.RatingCount : undefined;

  return {
    id: `impact-udemy-${id}`,
    provider: 'udemy',
    title,
    description: String(item.Description ?? '').slice(0, 300),
    skillTags: [query.toLowerCase().trim()],
    // URL plaina: o script impactStat('transformLinks') do layout faz o tracking.
    url,
    priceLabel: price != null ? `R$ ${price.toFixed(2).replace('.', ',')}` : 'Ver preço',
    rating:
      rating != null
        ? `${rating.toFixed(1)}${ratingCount != null ? ` (${ratingCount})` : ''}`
        : undefined,
  };
}

/** Busca cursos avulsos da Udemy no catálogo Impact (ItemSearch). */
export async function searchUdemyCourses(
  query: string,
  limit = 10,
): Promise<Course[]> {
  if (!isConfigured()) return [];

  try {
    const catalogId = await getUdemyCatalogId();
    if (!catalogId) return [];

    const data = (await impactFetch(
      `/Mediapartners/${process.env.IMPACT_ACCOUNT_SID}/Catalogs/${catalogId}/ItemSearch?ItemText=${encodeURIComponent(query)}&ItemLimit=${limit}`,
    )) as { Items?: ImpactItem[] };

    return (data?.Items || [])
      .map((item) => mapImpactItemToCourse(item, query))
      .filter((c): c is Course => c !== null)
      .slice(0, limit);
  } catch (error) {
    console.error(`[impact] Erro ao buscar cursos para "${query}":`, error);
    return [];
  }
}
