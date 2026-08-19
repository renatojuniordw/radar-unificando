# Arquitetura — Radar Unificando v2

## Camadas (Dependência Inward)

```
Presentation Layer (Next.js App Router + MUI 7 + Tailwind v4)
  ├── /            → home (hero, resultados, why-use, FAQ)
  ├── (auth)/      → login/register
  ├── (dashboard)/ → logado (perfil, /extensao/conectar) — guarded no layout server-side
  ├── /admin       → painel admin (métricas) — guarded por role no layout; noindex
  ├── /extensao    → página pública da extensão (marketing, JSON-LD)
  ├── /cursos      → hub de cursos + /cursos/[skill] (SSG, 71 skills)
  ├── /guia-ats    → guia de boas práticas ATS
  ├── /sobre       → página institucional
  ├── /doar        → página de doação (PIX)
  ├── /termos      → termos LGPD
  └── components/  → home/, busca/, profile/, layout/ (header, footer, UserMenu), seo/,
                     chat/, admin/, ats/, cursos/, job-table/, shared/, ui/
        |
API Layer (Route Handlers)
  ├── /api/pipeline (+ /stream, /:runId)
  ├── /api/vagas · /api/profile · /api/upload (+ /:jobId)
  ├── /api/chat (+ /history, /conversations, /context, /usage) · /api/ats/analyze
  ├── /api/auth/register · /api/health · /export (CSV/JSON)
  ├── /api/extension/analyze · /api/extension/feedback (Bearer token da extensão)
  ├── /api/extensao/status (sessão — status de conexão da extensão)
  └── Auth.js v5 (NextAuth, credentials)
        |
Application/Core Layer
  ├── core/pipeline/        → steps gupy/inhire/save/discovery + progress-emitter
  │   ├── query-expansion/  → expansão híbrida de queries (mapa curado + IA cacheada)
  │   ├── relevance-filter  → descarta design físico (moda/industrial)
  │   └── freshness         → descarta vagas com postedAt > 20 dias
  ├── core/extension/       → extension-token (SHA-256), extension-feedback
  ├── core/upload/          → upload-job-store (in-memory) + upload-processor (background)
  ├── core/parsing/         → pdf-to-markdown + resume-extraction-cache (hash, TTL 1h)
  ├── core/matching/        → recommendation.ts (token overlap)
  ├── core/ai/              → skill-extractor, chat-tools (agregador), tools/ (9 tools),
  │                           job-analyzer, cover-letter, interview-questions,
  │                           resume-adaptation-generator, query-expansion, pii-redactor,
  │                           llm-provider, chat-guard, shared/with-timeout (AbortSignal)
  ├── ats/                  → ats-analyzer (LLM v4), ats-heuristics, ats-service (cache,
  │                           buildAtsResumeInput, in-flight dedup), AtsResult type
  ├── core/mcp/             → gupy-client (JSON-RPC, paginado por offset)
  ├── core/scrapers/        → inhire-scraper
  ├── core/dedup/           → DedupEngine
  ├── core/discovery/       → company-discovery (executado para usuários logados)
  └── core/admin/           → admin-stats (summary, séries diárias, top termos/empresas/ferramentas)
        |
Domain Types
  ├── types/index.ts        → JobData, Platform, ProgressEvent
  └── lib/types/vaga.ts     → Vaga (UI)
        |
Infrastructure Layer
  ├── db/ (Prisma ORM + PostgreSQL + adapter-pg)
  ├── repositories/         → user, job, pipeline, chat, admin
  ├── redis/                → client, chat-lock, global-budget (orçamento diário USD)
  ├── storage/              → browser-storage.ts (IndexedDB via idb)
  ├── security/             → rate-limiter.ts (in-memory), rate-limit.ts (Redis)
  └── ui/                   → theme, theme-provider, auth-provider, query-provider
```

## Princípios

| Camada | SOLID | Segurança |
|--------|-------|-----------|
| Core | SRP + ISP (interfaces mínimas) | Dados sanitizados na entrada |
| Application | DIP (depende de abstrações) | Autenticação via Auth.js |
| Infrastructure | OCP (trocável via interface) | SQL injection: Prisma ORM |
| Presentation | SRP (página = 1 propósito) | XSS: MUI escapa HTML |

## Fluxo de Dados

1. Usuário submete `companies` e/ou `queries` → `POST /api/pipeline` (busca manual aplica cooldown de 5 min)
2. Cache SWR consultado (hit fresco devolve; stale revalida em background; expira após 30 min)
3. Queries são **expandidas** (mapa curado + IA cacheada, dedupe de quase-duplicatas, fail-open)
4. Pipeline roda **Gupy + InHire em paralelo**; logado + queries → MCP Gupy paginado (offset 0→500) com fallback REST
5. Filtros de qualidade aplicados: **relevância** (design físico) + **frescor** (postedAt > 20 dias)
6. Eventos SSE emitidos via `ProgressEmitter` (`/api/pipeline/stream`) — `pipeline_complete` carrega `jobs` para **todos** os usuários
7. Cliente recebe eventos e atualiza UI em tempo real (logados veem os resultados da busca)
8. Resultados ordenados por recência, deduplicados (por link), cap 200, salvos no PostgreSQL
9. **Pool público de vagas** (`PublicJob`, dedup por link, TTL 7 dias): alimentado por **toda** execução do pipeline (logada ou anônima) e lido pelas páginas estáticas de SEO `/vagas` e `/vagas/[cargo]`
10. Usuário visualiza vagas na tabela com filtros e export CSV/JSON
11. Chat assistente analisa perfil vs vagas via ferramentas IA

**Auto-sync (refresh silencioso ao entrar no site):** dispara no máximo 1×/15min, só quando há filtros salvos (companies/roles) e cooldown zero. Usa um limiter próprio (`pipelineAutoLimiter`, 2/5min) e **não** consome a cota nem aplica o cooldown da busca manual — o usuário pode buscar na hora. Ver `docs/SECURITY.md`.

**Upload de currículo (assíncrono):**
1. `POST /api/upload` valida (tamanho, magic bytes `%PDF-`) e faz o parsing do PDF
2. Cria job in-memory (`upload-job-store`) e responde `{jobId}` imediatamente
3. `upload-processor` roda em background: cache por hash → LLM extrai skills → upsert no profile
4. Cliente faz polling em `GET /api/upload/:jobId` (2s) até `completed`/`failed`

> Jobs de upload são in-memory (TTL 10min) — adequado ao app em container único, mesmo padrão do `ProgressEmitter` do pipeline.

## Integração com a Extensão Chrome

A extensão (MV3, side panel) reusa o motor ATS do backend e se autentica por **token**, não por cookie:

1. Usuário logado acessa `/extensao/conectar` → o backend gera um token (64 hex) e guarda **apenas o hash SHA-256** em `ExtensionToken` (`extension-token.ts`).
2. O token é entregue ao usuário de duas formas:
   - **Fluxo automático** (`launchWebAuthFlow`): `redirect_uri=<chrome-extension-id>.chromiumapp.org` → o backend redireciona com `?token=...` (validado por `isSafeRedirectUri`).
   - **Fluxo manual**: token exibido na página e copiado para a extensão.
3. A extensão envia `Authorization: Bearer <token>` em `POST /api/extension/analyze` e `POST /api/extension/feedback` (rate limit 20/min por usuário+IP).
4. `findUserIdByExtensionToken` resolve o token (atualiza `lastUsedAt`) e o `middleware.ts` só aceita requisições com `Origin: chrome-extension://<id>` se o valor estiver em `EXTENSION_ORIGIN`.
5. A página `/extensao/conectar` faz polling em `GET /api/extensao/status` (4s) para exibir "Extensão conectada" quando `lastUsedAt` é atualizado.

**Origem cruzada:** o middleware de CORS não reflete `Origin` — `EXTENSION_ORIGIN` é a única origem externa permitida nas rotas `/api/*` (ver `docs/SECURITY.md`).

## Cursos de Afiliado (Udemy)

Monetização via indicação de capacitação. Domínio em `src/lib/core/courses/`:

- **`course-catalog.ts`** — catálogo curado (`COURSES`, 16 cursos Udemy; `POPULAR_SKILLS` para SEO). URLs são páginas canônicas **reais** dos cursos (verificadas). Alura foi removido temporariamente (afiliação não aprovada).
- **`course-provider.ts`** — tipo `Course`, interface `CourseProvider`, `buildAffiliateUrl` (adiciona `?ref=` via `NEXT_PUBLIC_UDEMY_AFFILIATE_REF`).
- **`impact-client.ts`** — busca dinâmica no catálogo da Udemy via API da Impact (`searchUdemyCourses`) com scoring de relevância (título > descrição, penalidade para idiomas não-latinos) e cache Redis.
- **`course-matcher.ts`** — matching determinístico `recommendCourses(terms, area, limit=4)` com sinônimos (`k8s`→`kubernetes`) e scoring; `skillSlug`/`expandTokens`.
- **`course-skills.ts`** — helper das páginas estáticas `/cursos/[skill]` (SSG, 71 páginas).
- **Superfícies:** sidebar em `/busca`, hub `/cursos` (com CTA de fallback `trk.udemy.com` para buscar qualquer curso), chat (tool `recommend_courses` + bloco `📚`), extensão (seção "Cursos Recomendados"). Cliques rastreados em `CourseClick` via `POST /api/track/course-click` + GA4.

## Persistência no Navegador

- Anônimos: vagas, cooldown, `last_run_at`, filtros, chat id/histórico → **IndexedDB**
  (`browser-storage.ts`, DB `radar-unificando`, store `kv`). Auto-sync de 15 min.
- Logados: tudo no PostgreSQL.

## Painel Admin (`/admin`)

Área restrita a usuários com `role = 'admin'` (campo `User.role`, default `user`; o seed
cria o admin a partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD` do `.env` — sem credenciais no
código). Proteção em 3 camadas: middleware (`/admin` em
`protectedPaths` → login), layout server-side (`auth()` + role → `notFound()` para não-admin)
e `requireAdmin()` para APIs administrativas futuras. `robots.txt` bloqueia `/admin/` e o
layout emite `noindex, nofollow`.

- **Server-rendered** (`force-dynamic`), sem API route: as páginas chamam os serviços de
  `core/admin/` direto (`admin-stats.ts`, `admin-users.ts`).
- **Menu**: `components/admin/admin-nav.tsx` (Dashboard `/admin` + Usuários `/admin/usuarios`),
  renderizado no layout admin.
- **Filtro de período** no dashboard: presets 15/30/365 dias ou intervalo personalizado
  (`?days=N` ou `?from=YYYY-MM-DD&to=YYYY-MM-DD`), resolvido por `resolveAdminRange` em
  `core/admin/admin-stats.ts`; `components/admin/date-range-filter.tsx` navega via query
  params.
- **Dados**: `repositories/admin-repository.ts` (contadores, séries, `groupBy` de
  `ChatToolCall`, log de buscas, consumo por usuário) + agregação em JS (`bucketByDay` em
  America/Sao_Paulo, `countOccurrences`).
- **Tracking que alimenta as métricas**: `User.lastLoginAt` (atualizado no login),
  `PipelineRun` gravado em **toda** busca (anônimos com `userId` `null`, incluindo
  `queries`/`companies`), `ChatToolCall` (ferramentas de IA usadas no chat).
- **Métricas extras**: custo de IA do dia + orçamento global (via `getGlobalBudgetStatus`
  do Redis), buscas com erro (`status = 'failed'`) e split anônimo × logado
  (`userId null` vs não-nulo).
- **Datas**: chaves de dia `YYYY-MM-DD` (fuso SP); exibição pt-BR via
  `core/admin/date-format.ts` (`formatDayShort`/`formatDayFull` nos gráficos,
  `formatDateTimeSp` nas tabelas).
- **UI**: stat cards (com barra de progresso do orçamento) + gráficos Recharts
  (`components/admin/charts/`) + tabelas (`data-table.tsx`, `users-table.tsx`), seguindo o
  design system brutalist. `components/admin/auto-refresh.tsx` re-renderiza a página a cada
  60s via `router.refresh()` (monitoramento ao vivo).
