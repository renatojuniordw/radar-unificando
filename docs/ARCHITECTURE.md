# Arquitetura — Radar Unificando v2

## Camadas (Dependência Inward)

```
Presentation Layer (Next.js App Router + MUI 7 + Tailwind v4)
  ├── (public)/    → páginas anônimas (busca rápida)
  ├── (auth)/      → login/register
  └── (dashboard)/ → logado (perfil, match, kanban)
        |
API Layer
  ├── Route Handlers (REST)
  ├── Server Actions
  └── Auth.js v5 (NextAuth)
        |
Application Layer
  ├── PipelineOrchestrator (scrapers)
  ├── MatchingService (score engine)
  ├── ResumeService (parse + skills)
  └── ApplicationService (kanban state machine)
        |
Domain Layer
  ├── matching/scoring-engine.ts    → 9 componentes
  ├── matching/skill-taxonomy.ts    → taxonomia
  ├── matching/resume-adapter.ts    → template adapt
  ├── application/state-machine.ts  → 18 estágios
  ├── scrapers/*                    → IScraper
  └── gupy-mcp/client.ts            → JSON-RPC client
        |
Infrastructure Layer
  ├── db/ (Prisma ORM + PostgreSQL)
  ├── repositories/ (CRUD por entidade)
  ├── di/container.ts
  └── auth/auth.config.ts
```

## Princípios

| Camada | SOLID | Segurança |
|--------|-------|-----------|
| Domain | SRP + ISP (interfaces mínimas) | Dados sanitizados na entrada |
| Application | DIP (depende de abstrações) | Server Actions autenticadas |
| Infrastructure | OCP (trocável via interface) | SQL injection: Prisma ORM |
| Presentation | SRP (página = 1 propósito) | XSS: MUI escapa HTML |

## Fluxo de Dados

1. Usuário submete empresas → POST /api/pipeline
2. Pipeline roda em background, emite eventos SSE
3. Cliente recebe eventos e atualiza UI em tempo real
4. Resultados salvos em PostgreSQL via Prisma ORM
5. (Logado) Matching engine calcula score por vaga
6. (Logado) Kanban gerencia candidaturas com state machine
