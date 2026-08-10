# Arquitetura — Radar Unificando v2

## Camadas (Dependência Inward)

```
Presentation Layer (Next.js App Router + MUI 7 + Tailwind v4)
  ├── /            → home (hero, resultados, why-use, FAQ)
  ├── (auth)/      → login/register
  ├── (dashboard)/ → logado (perfil, /extensao/conectar) — guarded no layout server-side
  ├── /extensao    → página pública da extensão (marketing, JSON-LD)
  ├── /termos      → termos LGPD
  └── components/  → home/, profile/, layout/ (header, footer, UserMenu), seo/, chat
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
  ├── core/extension/       → extension-token (SHA-256), extension-feedback
  ├── core/upload/          → upload-job-store (in-memory) + upload-processor (background)
  ├── core/parsing/         → pdf-to-markdown + resume-extraction-cache (hash, TTL 1h)
  ├── core/matching/        → recommendation.ts (token overlap)
  ├── core/ai/              → skill-extractor, chat-tools, job-analyzer, cover-letter,
  │                           interview-questions, pii-redactor, llm-provider, chat-guard
  ├── ats/                  → ats-analyzer (LLM), ats-heuristics, ats-service (cache)
  ├── core/mcp/             → gupy-client (JSON-RPC)
  ├── core/scrapers/        → inhire-scraper
  ├── core/dedup/           → DedupEngine
  └── core/discovery/       → company-discovery (não acoplado ao pipeline ativo)
        |
Domain Types
  ├── types/index.ts        → JobData, Platform, ProgressEvent
  └── lib/types/vaga.ts     → Vaga (UI)
        |
Infrastructure Layer
  ├── db/ (Prisma ORM + PostgreSQL + adapter-pg)
  ├── repositories/         → user, job, pipeline, chat
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
2. Pipeline roda **Gupy + InHire em paralelo**; logado + queries → MCP Gupy com fallback REST
3. Eventos SSE emitidos via `ProgressEmitter` (`/api/pipeline/stream`)
4. Cliente recebe eventos e atualiza UI em tempo real
5. Resultados deduplicados (por link), cap 200, salvos no PostgreSQL
6. **Pool público de vagas** (`PublicJob`, dedup por link, TTL 7 dias): alimentado por **toda** execução do pipeline (logada ou anônima) e lido pelas páginas estáticas de SEO `/vagas` e `/vagas/[cargo]`
7. Usuário visualiza vagas na tabela com filtros e export CSV/JSON
8. Chat assistente analisa perfil vs vagas via ferramentas IA

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

## Cursos de Afiliado (Alura + Udemy)

Monetização via indicação de capacitação. Domínio em `src/lib/core/courses/`:

- **`course-catalog.ts`** — catálogo curado (`COURSES`, ~21 cursos; `POPULAR_SKILLS` para SEO). URLs são placeholders a trocar pelos deep links de afiliado (Awin p/ Alura; Rakuten/Impact p/ Udemy).
- **`course-provider.ts`** — tipo `Course`, interface `CourseProvider` (extensível para API da Udemy futura), `buildAffiliateUrl` (adiciona `?ref=` via `NEXT_PUBLIC_UDEMY_AFFILIATE_REF`).
- **`course-matcher.ts`** — matching determinístico `recommendCourses(terms, area, limit)` com sinônimos (`k8s`→`kubernetes`), área tech → Alura primeiro, cap 4/máx 2 por provider; `skillSlug`/`expandTokens`.
- **`course-skills.ts`** — helper das páginas estáticas `/cursos/[skill]` (SSG, 88 páginas).
- **Superfícies:** sidebar em `/busca`, hub `/cursos`, chat (tool `recommend_courses` + bloco `📚`), extensão (seção "Cursos Recomendados"). Cliques rastreados em `CourseClick` via `POST /api/track/course-click` + GA4.

## Persistência no Navegador

- Anônimos: vagas, cooldown, `last_run_at`, filtros, chat id/histórico → **IndexedDB**
  (`browser-storage.ts`, DB `radar-unificando`, store `kv`). Auto-sync de 15 min.
- Logados: tudo no PostgreSQL.
