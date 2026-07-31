# Radar Unificando

> Plataforma inteligente de busca de vagas remotas com IA — busque em **Gupy** e **InHire**, analise seu perfil, receba recomendações personalizadas e converse com um assistente de carreira.

Projeto original: [busca-vagas-gupy-inhire](https://github.com/anomalyco/busca-vagas-gupy-inhire)
Reescrito para web por: [Renato Bezerra](https://renatobezerra.com.br/)
Licença: MIT

---

## Funcionalidades

- **Busca em tempo real** em Gupy e InHire — sem base pré-carregada
- **Chat IA** para análise de perfil, recomendação de vagas, carta de apresentação e preparação de entrevistas
- **Importação de currículo** — upload PDF do LinkedIn ou texto colado, com extração automática de skills, experiência e senioridade
- **Score de match** — percentual de compatibilidade entre perfil e vaga com breakdown detalhado
- **Recomendação por perfil** — vagas ranqueadas por relevância ao seu perfil
- **Export CSV** — exporte a tabela de resultados filtrada
- **100% gratuito** — sem taxas, sem limite de buscas

## Stack

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | MUI 7 + Tailwind v4 |
| Design | Neo-Brutalism + Premium SaaS |
| Banco | PostgreSQL via Prisma ORM |
| Auth | Auth.js v5 (JWT + bcrypt) |
| Scraper Gupy | MCP oficial + REST fallback |
| AI | Vercel AI SDK (OpenAI-compatible) |
| Chat | @assistant-ui/react |

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
    api/           → API routes (pipeline, chat, profile, vagas)
  components/
    home/          → Hero, WhyUse, FAQ, Results, Loading
    profile/       → Import, Review, Completion
    layout/        → Header, Footer
  contexts/        → Chat assistant context
  hooks/           → Custom hooks (useJobSearch, useProfile)
  lib/
    core/          → Domínio (matching, pipeline, scrapers, AI)
    infrastructure/ → Infra (db, ui, security, repositories)
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
