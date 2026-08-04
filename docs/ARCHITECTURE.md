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
  ├── /api/vagas · /api/empresas · /api/presence · /api/profile · /api/upload
  ├── /api/chat (+ /history, /conversations) · /api/auth/register · /api/health
  ├── /export (CSV/JSON)
  └── Auth.js v5 (NextAuth, credentials)
        |
Application/Core Layer
  ├── core/pipeline/        → steps gupy/inhire/save/discovery + progress-emitter
  ├── core/matching/        → recommendation.ts (token overlap)
  ├── core/ai/              → skill-extractor, chat-tools, job-analyzer, cover-letter,
  │                           interview-questions, pii-redactor, llm-provider
  ├── core/mcp/             → gupy-client (JSON-RPC), gupy-validator
  ├── core/scrapers/        → inhire-scraper
  ├── core/dedup/           → DedupEngine
  └── core/discovery/       → company-discovery (não acoplado ao pipeline ativo)
        |
Domain Types
  ├── types/index.ts        → JobData, PipelineRun, PipelineStats, ProgressEvent
  └── lib/types/vaga.ts     → Vaga (UI)
        |
Infrastructure Layer
  ├── db/ (Prisma ORM + PostgreSQL + adapter-pg)
  ├── repositories/         → user, job, company, pipeline, chat
  ├── storage/              → browser-storage.ts (IndexedDB via idb)
  ├── security/             → rate-limiter.ts (in-memory), env.ts
  ├── di/container.ts
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

## Persistência no Navegador

- Anônimos: vagas, cooldown, `last_run_at`, filtros, chat id/histórico → **IndexedDB**
  (`browser-storage.ts`, DB `radar-unificando`, store `kv`). Auto-sync de 15 min.
- Logados: tudo no PostgreSQL.
