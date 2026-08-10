# Roadmap — Radar Unificando

## v1 (Manutenção)
- Scraper local + SQLite
- Brutalist UI
- Docker single service

## v2 (desenvolvimento atual — branches `feat/*` a partir de `main`)
- ✅ PostgreSQL + Prisma ORM
- ✅ Auth.js v5 (credentials + JWT, bcrypt cost=12)
- ✅ MUI 7 + Tailwind v4 (tema claro fixo; visual dark via estilos brutalistas — sem toggle)
- ✅ Gupy MCP + REST fallback + scraper InHire
- ✅ Páginas: home institucional + `/busca` (ferramenta), perfil, login/register, termos, sobre, doar, guia-ats, vagas públicas (ISR + JSON-LD)
- ✅ **SEO**: `sitemap.xml`, `robots.txt`, metadados por página, páginas SSG `/cursos/[skill]` (88 skills)
- ✅ **Afiliados Alura + Udemy**: catálogo curado + matcher determinístico (`src/lib/core/courses/`), recomendações na sidebar `/busca`, hub `/cursos`, chat (tool `recommend_courses`) e extensão ("Cursos Recomendados"); tracking de cliques em `CourseClick` + GA4
- ✅ **Pool público de vagas** (`PublicJob`, TTL 7 dias): alimentado por toda execução do pipeline, alimenta as páginas `/vagas` de SEO
- ✅ Chat assistente IA (MUI + `@ai-sdk/react`, PII redaction, proteção anti prompt injection)
- ✅ Upload PDF + extração IA (skills, cargo, área, senioridade, formação)
- ✅ Análise ATS dedicada (`POST /api/ats/analyze`) + análise de fit perfil × vaga via chat
- ✅ **Extensão Chrome** (MV3, side panel): análise de vaga em tempo real, score ATS, tokens por hash SHA-256, `/api/extension/analyze`, `/api/extension/feedback`, página `/extensao/conectar`
- ✅ Controle de orçamento diário global (USD) + tetos de tokens (100k/dia, 2M/mês, 300k/IP)
- ✅ Export CSV/JSON
- ✅ Design system Neo-Brutalism
- ✅ Documentação (docs/)
- ✅ Segurança: rate limiting (Redis + in-memory), prompt injection protection, env validation, validação de origem da extensão (`EXTENSION_ORIGIN`)
- ✅ Persistência anônima em IndexedDB (com auto-sync de 15 min — não consome o cooldown da busca manual; pula quando não há filtros salvos)
- ✅ PWA instalável (service worker em produção; offline completo ainda não)
- ✅ Suíte Vitest (47 arquivos · 253 testes passando) + e2e Playwright em `e2e/`
- ⏳ Performance audit
- ⏳ Acessibilidade audit

> Histórico: a API de **reescrita de currículos** (resume adaptation) foi implementada e depois **removida** (commit `0465180`) — o tipo `resume_adaptation` permanece no `ai-logger` apenas como vestígio.

## v3 (Futuro)
- Notificações em tempo real
- Integração com LinkedIn API
- Pipeline Discovery avançado (mais fontes — código já existe, `discoveryEnabled: false`)
- App mobile (React Native)
- Modo offline completo (PWA)
