# Arquitetura — Radar Unificando v2

## Camadas (Dependência Inward)

```
Presentation Layer (Next.js App Router + MUI 7 + Tailwind v4)
  ├── /            → home (hero, resultados, why-use, FAQ)
  ├── (auth)/      → login/register
  ├── (dashboard)/ → logado (perfil) — guarded no layout server-side
  ├── /termos      → termos LGPD
  └── components/  → home/, profile/, layout/ (header, footer, UserMenu), seo/, chat
        |
API Layer (Route Handlers)
  ├── /api/pipeline (+ /stream, /:runId)
  ├── /api/vagas · /api/profile · /api/upload (+ /:jobId)
  ├── /api/chat (+ /history, /conversations) · /api/auth/register · /api/health
  ├── /export (CSV/JSON)
  └── Auth.js v5 (NextAuth, credentials)
        |
Application/Core Layer
  ├── core/pipeline/        → steps gupy/inhire/save/discovery + progress-emitter
  ├── core/upload/          → upload-job-store (in-memory) + upload-processor (background)
  ├── core/parsing/         → pdf-to-markdown + resume-extraction-cache (hash, TTL 1h)
  ├── core/matching/        → recommendation.ts (token overlap)
  ├── core/ai/              → skill-extractor, chat-tools, job-analyzer, cover-letter,
  │                           interview-questions, pii-redactor, llm-provider
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

1. Usuário submete `companies` e/ou `queries` → `POST /api/pipeline`
2. Pipeline roda **Gupy + InHire em paralelo**; logado + queries → MCP Gupy com fallback REST
3. Eventos SSE emitidos via `ProgressEmitter` (`/api/pipeline/stream`)
4. Cliente recebe eventos e atualiza UI em tempo real
5. Resultados deduplicados (por link), cap 200, salvos no PostgreSQL
6. Usuário visualiza vagas na tabela com filtros e export CSV/JSON
7. Chat assistente analisa perfil vs vagas via ferramentas IA

**Upload de currículo (assíncrono):**
1. `POST /api/upload` valida (tamanho, magic bytes `%PDF-`) e faz o parsing do PDF
2. Cria job in-memory (`upload-job-store`) e responde `{jobId}` imediatamente
3. `upload-processor` roda em background: cache por hash → LLM extrai skills → upsert no profile
4. Cliente faz polling em `GET /api/upload/:jobId` (2s) até `completed`/`failed`

> Jobs de upload são in-memory (TTL 10min) — adequado ao app em container único, mesmo padrão do `ProgressEmitter` do pipeline.

## Persistência no Navegador

- Anônimos: vagas, cooldown, `last_run_at`, filtros, chat id/histórico → **IndexedDB**
  (`browser-storage.ts`, DB `radar-unificando`, store `kv`). Auto-sync de 15 min.
- Logados: tudo no PostgreSQL.
