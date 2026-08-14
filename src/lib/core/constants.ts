// Constantes públicas e personalizadas do projeto (links, IDs de tracking e
// afiliados). Centralizadas aqui para facilitar a manutenção.
// Segredos (IMPACT_AUTH_TOKEN, AI_API_KEY, etc.) NÃO entram aqui — continuam no .env.

export const SITE = {
  name: "Radar Unificando",
  url: "https://radar.unificando.com.br",
  logo: "https://radar.unificando.com.br/logo.png",
} as const;

export const LINKS = {
  unificando: "https://unificando.com.br/",
  portfolio: "https://renatobezerra.com.br/",
  github: "https://github.com/renatojuniordw/radar-unificando",
  costs: "https://github.com/renatobezerra/radar-unificando/blob/main/COSTS.md",
} as const;

export const IMPACT = {
  apiBase: "https://api.impact.com",
  accountSid: "7591577",
  scriptUrl:
    "https://utt.impactcdn.com/P-A7591577-ee13-4a49-8d27-59b5a61f41ec1.js",
  siteVerification: "ff7672f3-df2c-43e0-8c56-c3448dd4896a",
  udemyFallbackUrl: "https://trk.udemy.com/c/7591577/3193860/39854",
  udemyCatalogId: "26324",
} as const;

export const ANALYTICS = {
  gaId: "G-CPZPJGTL92",
} as const;

// Endpoints de APIs externas usadas pelo projeto. Apenas URLs públicas —
// chaves de acesso (AI_API_KEY, IMPACT_AUTH_TOKEN, etc.) continuam no .env.
export const API_ENDPOINTS = {
  gupyMcp: "https://candidates.mcp.api.gupy.io/mcp",
  gupyJobs: "https://employability-portal.gupy.io/api/v1/jobs",
  inhire: "https://api.inhire.app/job-posts/public/pages",
  waybackCdx:
    "https://web.archive.org/cdx/search/cdx?output=json&fl=original,timestamp&limit=50",
  urlscanSearch: "https://urlscan.io/api/v1/search/?q=",
  openaiBase: "https://api.openai.com/v1",
} as const;
