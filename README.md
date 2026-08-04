# Radar Unificando

> Plataforma inteligente de busca de vagas remotas com IA — busque em **Gupy** e **InHire**, analise seu perfil, receba recomendações personalizadas e converse com um assistente de carreira.

Desenvolvido por: [Renato Bezerra](https://renatobezerra.com.br/)
Licença: MIT

---

## Funcionalidades

- **Busca em tempo real** em Gupy e InHire — sem base pré-carregada
- **Chat IA** para análise de perfil, recomendação de vagas, carta de apresentação e preparação de entrevistas (com redação de PII e proteção contra prompt injection)
- **Importação de currículo** — upload PDF do LinkedIn ou texto colado, com extração automática de skills, experiência e senioridade
- **Análise de match** — compara perfil × vaga com skills casadas/faltantes e fit geral
- **Recomendação por perfil** — vagas ranqueadas por relevância ao seu perfil
- **Export CSV/JSON** — exporte a tabela de resultados filtrada
- **100% gratuito** — sem taxas (com rate limits anti-abuso)

## Stack

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | MUI 7 + Tailwind v4 |
| Design | Neo-Brutalism + Premium SaaS |
| Banco | PostgreSQL via Prisma ORM |
| Auth | Auth.js v5 (credentials + JWT + bcrypt) |
| Scraper Gupy | MCP oficial + REST fallback |
| AI | Vercel AI SDK (OpenAI-compatible) |
| Chat | MUI + `@ai-sdk/react` (useChat) |
| Storage anônimo | IndexedDB via `idb` |

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

## Desenvolvimento

```bash
npm install
npm run dev
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build produção |
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
    (auth)/        → Login e registro
    (dashboard)/   → Perfil do usuário
    api/           → API routes (pipeline, chat, empresas, profile, vagas, upload…)
    export/        → Export CSV/JSON
    termos/        → Termos LGPD
  components/
    home/          → Hero, WhyUse, FAQ, Results, Loading
    profile/       → Import, Review, Completion
    layout/        → Header, Footer, UserMenu
    seo/           → Structured data, JobPosting schema
  contexts/        → Chat assistant context
  hooks/           → Custom hooks (useJobSearch, useProfile)
  lib/
    core/          → Domínio (matching, pipeline, scrapers, AI)
    infrastructure/ → Infra (db, repositories, storage, security, ui)
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

## Créditos

- [@anomalyco](https://github.com/anomalyco) — scraper original Node.js + PowerShell
- [Renato Bezerra](https://renatobezerra.com.br/) — reescrita para Next.js + web
