// Cliente da API Impact Radius (Udemy Affiliate) — server-side apenas.
// O token é secreto (IMPACT_AUTH_TOKEN); todo acesso à API acontece aqui.
// Fail-open: qualquer falha retorna [] para nunca derrubar a UX.

import type { Course } from './course-provider';

const IMPACT_BASE = 'https://api.impact.com';
const TIMEOUT_MS = 6000;

interface ImpactItem {
  id?: string;
  Id?: string;
  ItemSID?: string;
  Name?: string;
  Title?: string;
  Description?: string;
  Price?: number;
  CurrentPrice?: string;
  Currency?: string;
  Rating?: number;
  RatingCount?: number;
  Category?: string;
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
    headers: { Authorization: authHeader(), Accept: 'application/json' },
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
  const id = String(item.ItemSID ?? item.Id ?? item.id ?? '');
  const title = String(item.Name ?? item.Title ?? '').trim();
  const url = String(item.Url ?? '').trim();
  if (!id || !title || !url) return null;

  const price =
    typeof item.Price === 'number'
      ? item.Price
      : item.CurrentPrice != null
        ? parseFloat(item.CurrentPrice)
        : undefined;
  const currencySymbol = item.Currency && item.Currency !== 'BRL' ? 'US$' : 'R$';
  const rating = typeof item.Rating === 'number' ? item.Rating : undefined;
  const ratingCount = typeof item.RatingCount === 'number' ? item.RatingCount : undefined;

  return {
    id: `impact-udemy-${id}`,
    provider: 'udemy',
    title,
    description: String(item.Description ?? '').slice(0, 300),
    skillTags: [query.toLowerCase().trim()],
    // URL já vem com tracking da Impact (ex.: trk.udemy.com/c/.../u=...) quando vinda do catálogo;
    // links planos (udemy.com) são reescritos no client pelo script impactStat('transformLinks').
    url,
    priceLabel:
      price != null && !Number.isNaN(price)
        ? `${currencySymbol} ${price.toFixed(2).replace('.', ',')}`
        : 'Ver preço',
    rating:
      rating != null
        ? `${rating.toFixed(1)}${ratingCount != null ? ` (${ratingCount})` : ''}`
        : undefined,
  };
}

const ITEMS_PAGE_SIZE = 100;

/**
 * Busca cursos avulsos da Udemy no catálogo Impact.
 * Observação: o endpoint /ItemSearch retorna 403 (Access Denied) com o
 * escopo atual do token — não há busca full-text disponível na API. Como
 * alternativa, paginamos /Items (listagem plana, sem relevância) e filtramos
 * localmente pelos termos da query, igual ao CuratedCatalogProvider.
 */
export async function searchUdemyCourses(
  query: string,
  limit = 10,
): Promise<Course[]> {
  if (!isConfigured()) return [];

  try {
    const catalogId = await getUdemyCatalogId();
    if (!catalogId) return [];

    const data = (await impactFetch(
      `/Mediapartners/${process.env.IMPACT_ACCOUNT_SID}/Catalogs/${catalogId}/Items?PageSize=${ITEMS_PAGE_SIZE}`,
    )) as { Items?: ImpactItem[] };

    const tokens = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1);

    const items = data?.Items || [];
    const matched =
      tokens.length === 0
        ? items
        : items.filter((item) => {
            const haystack = `${item.Name ?? ''} ${item.Description ?? ''} ${item.Category ?? ''}`.toLowerCase();
            return tokens.some((t) => haystack.includes(t));
          });

    return matched
      .map((item) => mapImpactItemToCourse(item, query))
      .filter((c): c is Course => c !== null)
      .slice(0, limit);
  } catch (error) {
    console.error(`[impact] Erro ao buscar cursos para "${query}":`, error);
    return [];
  }
}
