# Radar Unificando

> Plataforma inteligente de busca de vagas (todas as áreas profissionais, trabalho remoto, híbrido ou presencial) com IA — busque em **Gupy** e **InHire**, analise seu perfil, receba recomendações de cursos e converse com um assistente de carreira.

Desenvolvido por: [Renato Bezerra](https://renatobezerra.com.br/)
Licença: MIT
Apoie: [![Doar-PIX](https://img.shields.io/badge/Doar-PIX-ccff00)](https://radar.unificando.com.br/doar)

---

## Funcionalidades

- **Busca em tempo real** em Gupy e InHire para todas as áreas profissionais — sem base pré-carregada
- **Busca inteligente** — expansão de queries (sinônimos PT/EN via mapa curado + IA cacheada), dedupe de quase-duplicatas, filtro de relevância (descarta design físico em buscas de design) e de frescor (vagas com mais de 20 dias)
- **Chat IA** para análise de perfil, recomendação de vagas, carta de apresentação e preparação de entrevistas (com redação de PII e proteção contra prompt injection)
- **Importação de currículo** — upload PDF do LinkedIn ou texto colado, com extração automática de skills, experiência, cargo e senioridade
- **Análise de match & ATS** — compara perfil × vaga com score 0-100, skills casadas/faltantes e fit geral
- **Cursos Recomendados** — sugestões personalizadas de capacitação na **Udemy** (catálogo curado + busca no catálogo da Impact) baseadas nas lacunas técnicas do currículo, com CTA de fallback para buscar qualquer curso
- **Recomendação por perfil** — vagas ranqueadas por relevância ao seu perfil
- **Análise ATS dedicada** — score 0-100 do currículo × vaga, com palavras-chave faltando e recomendações
- **Currículo adaptado (PDF)** — gera uma versão do seu currículo adaptada à vaga, com download direto em PDF
- **Export CSV/JSON** — exporte a tabela de resultados filtrada
- **Painel Admin** — métricas de usuários, buscas e uso de IA com gráficos (Recharts), filtro por período, tabela de usuários e auto-refresh — acesso restrito a `role=admin`
- **Extensão Chrome (Side Panel)** — analisa a vaga aberta na página e mostra score ATS e cursos recomendados (endpoints `POST /api/extension/analyze` e `POST /api/extension/feedback`). **Status: EM BREVE** — em homologação na Chrome Web Store
- **100% gratuito para usuários** — mantido por doações. Limites justos de uso: janela de contexto por conversa, teto diário e mensal de tokens de IA (renovam à meia-noite e no dia 1º) — detalhes em `/termos` e `docs/AI.md`

## Stack

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | MUI 7 + Tailwind v4 |
| Design | Neo-Brutalism + Premium SaaS |
| Banco | PostgreSQL via Prisma ORM |
| Cache/Fila | Redis (rate limiting, cache, locks) |
| Auth | Auth.js v5 (credentials + JWT + bcrypt) |
| Scraper Gupy | MCP oficial + REST fallback |
| AI | Vercel AI SDK (OpenAI-compatible) |
| Chat | MUI + `@ai-sdk/react` (useChat) |
| Storage anônimo | IndexedDB via `idb` |

## Apoie o projeto

O Radar Unificando é gratuito e open source, mas tem custos reais de infraestrutura
(VPS, banco, Redis e tokens de IA no chat). Se a ferramenta te ajudou, considere doar:

- **PIX** (Brasil, sem taxa): QR e chave em [radar.unificando.com.br/doar](https://radar.unificando.com.br/doar)

Custos mensais transparentes: veja [`COSTS.md`](./COSTS.md).

## Como Rodar

**Pré-requisito:** Docker instalado.

```bash
# Setup inicial
cp .env.example .env
# Preencha DATABASE_URL e AUTH_SECRET

# Subir banco + app
docker compose up
```

Abra [http://localhost:11010](http://localhost:11010)

> **Portas locais (Docker):** app `11010`, PostgreSQL `11011`, Redis `11012` — configuradas para não conflitar com outros projetos na máquina (ex: medicamentos usa a 5432). Ajuste `DATABASE_URL` no `.env` conforme a porta do postgres.

## Desenvolvimento

```bash
npm install
npm run dev
```

> **Atenção:** `next build` e `next dev` compartilham o diretório `.next` por padrão — rodar um build enquanto o dev está ativo corrompe o cache do dev (500 em tudo). Para validar um build sem derrubar o dev, use um diretório separado:
> ```bash
> NEXT_DIST_DIR=.next-check npm run build
> ```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (porta 11010) |
| `npm run build` | Build produção |
| `NEXT_DIST_DIR=.next-check npm run build` | Build de validação (não toca no `.next` do dev) |
| `npm run lint` | Lint |
| `npm run test` | Testes Vitest |
| `npm run test:coverage` | Testes com cobertura |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run db:migrate` | Migrations Prisma |
| `npm run db:seed` | Seed dados iniciais |
| `npm run db:studio` | Prisma Studio |

## Estrutura

```
src/
  app/
    (auth)/        → Login, register, forgot-password, reset-password
    (dashboard)/   → Perfil do usuário, conexão da extensão (/extensao/conectar)
    admin/         → Painel admin (métricas, usuários) — restrito por role, noindex
    api/
      ats/         → Análise ATS dedicada
      auth/        → NextAuth + registro + recuperação de senha
      chat/        → Chat IA (streaming, histórico, conversas, uso)
      courses/     → Busca de cursos (Impact/Udemy)
      cron/        → Rotina de retenção LGPD
      export/      → Export CSV/JSON
      extensao/    → Status de conexão da extensão
      extension/   → Análise + feedback da extensão Chrome
      health/      → Health check
      pipeline/    → Pipeline de busca (+ /stream, /:runId)
      profile/     → CRUD de perfil
      resume/      → Geração de currículo adaptado (PDF)
      track/       → Tracking de cliques em cursos
      upload/      → Upload de currículo (async)
      vagas/       → Listagem de vagas
    busca/         → Busca com resultados e análise ATS (busca-client.tsx, client-side)
    cursos/        → Hub de cursos + /cursos/[skill] (SSG, 71 skills)
    doar/          → Página de doação (PIX)
    export/        → Export CSV/JSON
    extensao/      → Página pública da extensão (marketing)
    guia-ats/      → Guia de boas práticas ATS
    sobre/         → Página institucional
    termos/        → Termos LGPD
  components/
    admin/         → Dashboard admin, gráficos (Recharts), tabela de usuários
    ats/           → Drawer de análise ATS + AtsResultsContent (compartilhado)
    busca/         → Busca header, recomendações de curso lateral
    chat/          → UI do assistente (sidebar, bolhas, sugestões, cards)
    cursos/        → Cards de cursos, grade de recomendação
    home/          → Hero, WhyUse, FAQ, Results, Loading
    job-table/     → Tabela de vagas (desktop/mobile/filtros)
    layout/        → Header, Footer, UserMenu
    profile/       → Import, Review, Completion
    seo/           → Structured data, JobPosting schema, Breadcrumb schema
    shared/        → Componentes reutilizáveis (support-section, etc.)
    ui/            → Cookie consent, PWA register, error boundary
  contexts/        → Chat assistant context
  hooks/           → Custom hooks (useJobSearch, useProfile, useChatConversation, etc.)
  lib/
    core/
      admin/       → Estatísticas do admin (métricas, séries, top termos)
      ai/          → IA: prompts, tools (9), chat-guard, pii-redactor, llm-provider
        ats/       → Análise ATS (analyzer, heuristics, service)
        prompts/   → System prompts (um por feature)
        shared/    → Helpers compartilhados (with-timeout, security-rules)
        tools/     → 9 tools do chat (search-jobs, analyze-ats-score, etc.)
      auth/        → Auth.js config
      courses/     → Catálogo Udemy, matcher, Impact client, recomendação
      dedup/       → DedupEngine
      discovery/   → CompanyDiscovery (Wayback/Urlscan)
      extension/   → Token SHA-256, feedback
      jobs/        → Lógica de vagas
      matching/    → Recomendação por perfil (token overlap)
      mcp/         → Cliente MCP da Gupy (JSON-RPC)
      parsing/     → PDF→markdown + cache de extração
      pipeline/    → Pipeline de busca (steps, query-expansion, filtros)
      profile/     → Lógica de perfil
      scrapers/    → InHire scraper
      seo/         → Sitemap, robots, structured data
      upload/      → Upload assíncrono (store + processor)
      vagas/       → Lógica de listagem de vagas
    infrastructure/
      cache/       → Cache Redis
      cleanup/     → Retenção LGPD
      db/          → Prisma client
      email/       → Resend
      redis/       → Redis client, chat-lock, global-budget
      repositories/→ Repositórios (user, job, pipeline, chat, admin, etc.)
      security/    → Rate limiter, env validation
      storage/     → IndexedDB (browser)
      ui/          → Theme, providers (MUI, Auth, Query)
    pdf/           → Geração de PDF (currículo adaptado)
    types/         → Tipos do domínio
    utils/         → Utilitários gerais
  __tests__/       → Testes unitários (Vitest)
  __mocks__/       → Mocks para testes
```

## Documentação

Veja `docs/` para documentação detalhada:

| Documento | Conteúdo |
|-----------|----------|
| `ARCHITECTURE.md` | Camadas, fluxo de dados, diagramas |
| `DESIGN_SYSTEM.md` | Design system Neo-Brutalist, componentes |
| `DATABASE.md` | Schema Prisma, migrações |
| `API.md` | Rotas REST, exemplos curl |
| `SECURITY.md` | JWT, rate limiting, sanitização |
| `PIPELINE.md` | Steps do pipeline de busca |
| `AI.md` | Pipeline de IA, modelos, tools |
| `UX_FLOW.md` | Wireframes, estados, interações |
| `CONTRIBUTING.md` | Setup dev, branch strategy |
| `ROADMAP.md` | Roadmap v1 → v2 → v3 |
| `INTEGRATIONS_IMPACT.md` | Permissões e escopos da API Impact (afiliado Udemy) |
| `business-rules.md` | Regras de negócio mapeadas (dedup, pipeline, IA) |

## Créditos

- [@anomalyco](https://github.com/anomalyco) — scraper original Node.js + PowerShell
- [Renato Bezerra](https://renatobezerra.com.br/) — reescrita para Next.js + web
