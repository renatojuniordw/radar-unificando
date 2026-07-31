# Arquitetura — Radar Unificando v2

## Camadas (Dependência Inward)

```
Presentation Layer (Next.js App Router + MUI 7 + Tailwind v4)
  ├── (public)/    → páginas anônimas (busca rápida)
  ├── (auth)/      → login/register
  └── (dashboard)/ → logado (perfil)
        |
API Layer
  ├── Route Handlers (REST)
  ├── Server Actions
  └── Auth.js v5 (NextAuth)
        |
Application Layer
  ├── PipelineOrchestrator (scrapers)
  ├── ResumeService (parse + skills)
  └── ChatService (assistente IA)
        |
Domain Layer
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
| Application | DIP (depende de abstrações) | Autenticação via Auth.js |
| Infrastructure | OCP (trocável via interface) | SQL injection: Prisma ORM |
| Presentation | SRP (página = 1 propósito) | XSS: MUI escapa HTML |

## Fluxo de Dados

1. Usuário submete `companies` e/ou `queries` → `POST /api/pipeline`
2. Pipeline monta buscas: combina `jobName` (queries) + `careerPageName` (companies) por empresa
3. Pipeline roda em background, emite eventos SSE
4. Cliente recebe eventos e atualiza UI em tempo real
5. Resultados salvos em PostgreSQL via Prisma ORM
6. Usuário visualiza vagas na tabela com filtros e export CSV
7. Chat assistente analisa perfil vs vagas via IA
