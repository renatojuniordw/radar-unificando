// Cliente da API Impact Radius (Udemy Affiliate) — server-side apenas.
// O token é secreto (IMPACT_AUTH_TOKEN); todo acesso à API acontece aqui.
// Fail-open: qualquer falha retorna [] para nunca derrubar a UX.

import type { Course } from './course-provider';
import { IMPACT } from '@/lib/core/constants';

const IMPACT_BASE = IMPACT.apiBase;
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
  // Aceita URI relativa (padrão) ou absoluta (se a API devolver url completa).
  const url = path.startsWith('http') ? path : `${IMPACT_BASE}${path}`;
  const res = await fetch(url, {
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
const MAX_ITEMS_PAGES = 3;

// ---------------------------------------------------------------------------
// Scoring de relevância (funções puras — testáveis sem rede).
// ---------------------------------------------------------------------------

export interface ImpactItemScore {
  /** Tokens da query encontrados no título. */
  titleMatches: number;
  /** Tokens da query encontrados em descrição/categoria (fora do título). */
  otherMatches: number;
  /** 2 se o título parece português, senão 0. */
  ptBoost: number;
  /** -100 se o título usa script não-latino (árabe, cirílico, etc.), senão 0. */
  nonLatinPenalty: number;
  /** Soma ponderada. */
  total: number;
}

/** Minúsculas + NFD + remove acentos (mesmo padrão do course-matcher). */
export function normalizeImpactText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Tokeniza texto normalizado em termos significativos (len > 1). */
export function tokenizeImpactText(text: string): string[] {
  return normalizeImpactText(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

const PT_ACCENT_RE = /[ãõçáéíóúâêôàü]/;
const PT_WORDS = new Set([
  'curso', 'completo', 'para', 'aprenda', 'domine', 'pratica', 'iniciante',
  'avancado', 'profissional', 'essencial', 'fundamentos', 'tecnicas', 'como',
  'voce', 'seu', 'sua', 'aula', 'certificado', 'basico', 'zero',
]);

/** Heurística de português: acentos PT no título cru OU palavras PT comuns. */
export function looksPortuguese(text: string): boolean {
  const lower = text.toLowerCase();
  if (PT_ACCENT_RE.test(lower)) return true;
  const words = new Set(lower.split(/[^a-z0-9]+/).filter((w) => w.length > 1));
  return [...PT_WORDS].some((w) => words.has(w));
}

const NON_LATIN_RE =
  /[\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u0400-\u04FF\u3040-\u30FF\uAC00-\uD7AF\u4E00-\u9FFF]/;

/** Detecta script não-latino no título (árabe, devanagari, tailandês, cirílico, etc.). */
export function hasNonLatinScript(text: string): boolean {
  return NON_LATIN_RE.test(text);
}

/** Pontua um item do catálogo contra os tokens da query. */
export function scoreImpactItem(item: ImpactItem, tokens: string[]): ImpactItemScore {
  const titleTokens = new Set(tokenizeImpactText(item.Name ?? ''));
  const otherTokens = new Set(
    tokenizeImpactText(`${item.Description ?? ''} ${item.Category ?? ''}`),
  );

  let titleMatches = 0;
  let otherMatches = 0;
  for (const t of tokens) {
    if (titleTokens.has(t)) titleMatches++;
    else if (otherTokens.has(t)) otherMatches++;
  }

  const ptBoost = looksPortuguese(item.Name ?? '') ? 2 : 0;
  const nonLatinPenalty = hasNonLatinScript(item.Name ?? '') ? -100 : 0;

  return {
    titleMatches,
    otherMatches,
    ptBoost,
    nonLatinPenalty,
    total: titleMatches * 3 + otherMatches + ptBoost + nonLatinPenalty,
  };
}

/** Decide se o item é relevante: 1 token no título OU 2+ tokens no total. */
export function isImpactMatch(score: ImpactItemScore): boolean {
  if (score.nonLatinPenalty < 0) return false;
  return score.titleMatches >= 1 || score.titleMatches + score.otherMatches >= 2;
}

interface ImpactItemsResponse {
  Items?: ImpactItem[];
  '@nextpageuri'?: string;
}

/**
 * Busca cursos avulsos da Udemy no catálogo Impact.
 * Observação: o endpoint /ItemSearch retorna 403 (Access Denied) com o
 * escopo atual do token — não há busca full-text disponível na API. Como
 * alternativa, paginamos /Items (listagem plana, sem relevância) e pontuamos
 * localmente: match no título vale mais, título em português ganha boost e
 * scripts não-latinos são descartados.
 */
export async function searchUdemyCourses(
  query: string,
  limit = 10,
): Promise<Course[]> {
  if (!isConfigured()) return [];

  try {
    const catalogId = await getUdemyCatalogId();
    if (!catalogId) return [];

    const tokens = tokenizeImpactText(query);
    if (tokens.length === 0) return [];

    const scored: Array<{ item: ImpactItem; score: ImpactItemScore }> = [];
    let nextUri: string | undefined =
      `/Mediapartners/${process.env.IMPACT_ACCOUNT_SID}/Catalogs/${catalogId}/Items?PageSize=${ITEMS_PAGE_SIZE}`;

    for (let page = 0; page < MAX_ITEMS_PAGES && nextUri; page++) {
      const data = (await impactFetch(nextUri)) as ImpactItemsResponse;
      for (const item of data?.Items ?? []) {
        const score = scoreImpactItem(item, tokens);
        if (isImpactMatch(score)) scored.push({ item, score });
      }
      // Early-stop: já temos candidatos suficientes para ordenar por rating.
      if (scored.length >= limit * 2) break;
      nextUri = data['@nextpageuri'];
    }

    scored.sort(
      (a, b) =>
        b.score.total - a.score.total ||
        (Number(b.item.Rating) || 0) - (Number(a.item.Rating) || 0) ||
        (Number(b.item.RatingCount) || 0) - (Number(a.item.RatingCount) || 0),
    );

    return scored
      .slice(0, limit)
      .map((s) => mapImpactItemToCourse(s.item, query))
      .filter((c): c is Course => c !== null);
  } catch (error) {
    console.error(`[impact] Erro ao buscar cursos para "${query}":`, error);
    return [];
  }
}
