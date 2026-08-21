# Roadmap — Radar Unificando

## MVP local (concluído)
- Scraper local + SQLite
- Brutalist UI
- Docker single service

## Migração para produção (atual — branches `feat/*` a partir de `main`)
- ✅ PostgreSQL + Prisma ORM
- ✅ Auth.js v5 (credentials + JWT, bcrypt cost=12)
- ✅ MUI 7 + Tailwind v4 (tema claro fixo; visual dark via estilos brutalistas — sem toggle)
- ✅ Gupy MCP + REST fallback + scraper InHire
- ✅ Páginas: home institucional + `/busca` (ferramenta), perfil, login/register, termos, sobre, doar, `/dicas` (tutoriais), vagas públicas (ISR + JSON-LD)
- ✅ **SEO**: `sitemap.xml`, `robots.txt`, metadados por página, páginas SSG `/cursos/[skill]` (71 skills)
- ✅ **Afiliados Udemy**: catálogo curado + matcher determinístico + busca no catálogo da Impact (`searchUdemyCourses`, cache Redis), recomendações na sidebar `/busca`, hub `/cursos` (com CTA de fallback `trk.udemy.com`), chat (tool `recommend_courses`) e extensão ("Cursos Recomendados"); tracking de cliques em `CourseClick` + GA4
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
- ✅ Suíte Vitest (226 arquivos · 1677 testes passando) + e2e Playwright em `e2e/`
- ✅ **Currículo adaptado (PDF + Word)**: tool `generate_resume` no chat + `POST /api/resume/generate` + botão por vaga na `/busca` (download direto em PDF e DOCX), com veracidade garantida em 3 camadas
- ✅ **Banner de currículo desatualizado**: aviso na aba de perfil quando o currículo base tem 60+ dias, com botão "Atualizar Agora"
- ✅ **Rate limiting da análise ATS** (`/api/ats/analyze`) e da geração de currículo (`resume_daily`)
- ✅ **Expansão híbrida de queries**: mapa curado + IA cacheada (Redis global) + dedupe de quase-duplicatas, com fail-open e single-flight
- ✅ **Filtro de relevância**: descarta vagas de design físico (moda/industrial) em buscas de design
- ✅ **Filtro de frescor**: descarta vagas com `postedAt` > 20 dias
- ✅ **Paginação do MCP Gupy**: offset 0→500 (antes 1 chamada de 100 por query — logados recebiam menos que anônimos)
- ✅ **Cache SWR do pipeline** (stale-while-revalidate, 5 min stale / 30 min expire)
- ✅ **Resultados da busca exibidos para logados**: `pipeline_complete` carrega `jobs` para todos os usuários (antes só anônimos; logados recarregavam a lista recomendada por perfil)
- ✅ **Ordenação por recência** dos resultados do pipeline (`sortJobsByRecency`)
- ✅ **Painel admin** (`/admin`, role `admin` no User): métricas de usuários, logins, buscas (termos/empresas), ferramentas de chat, tokens e cursos por dia (Recharts)
- ✅ **Refatoração fasedada** (branch `feat/refactor`): `AtsResultsContent` compartilhado, Zod validation em chat/history, rate limiting em chat/history, dynamic imports para Recharts (~200KB), `useMemo` em admin dashboard, `aria-label` em botões de ação, Server Component para FaqStructuredData
- ✅ **Dicas de carreira** (`/dicas`): hub server-rendered com filtro por categoria (?categoria=), catálogo de 4 artigos (currículo ATS, uso do Radar, entrevista TI, adaptar currículo), artigos SSG+ISR, FAQ, JSON-LD (Article + FAQ + Breadcrumb), substituiu `/guia-ats`
- ✅ **E-mail de boas-vindas**: `sendWelcomeEmail()` via Resend no registro (`email-service.ts`), com 3 passos iniciais; fallback em dev sem `RESEND_API_KEY`
- ✅ **Profile tab extraction**: `ProfileTab` extraído de `perfil/page.tsx`, `GeneratedResumesTab` com paginação server-side (`GET /api/resume/history?page=&pageSize=`)
- ✅ **Consolidação de docs**: `DESIGN.md` e `COSTS.md` movidos/consolidados em `docs/`, relatório LGPD removido (obsoleto)
- ✅ **Schemas de SEO para cursos e FAQs**: `CourseListSchema` e FAQ JSON-LD em `busca`, `cursos/[skill]` e layout raiz; otimização da estrutura de dados de postagens de emprego
- ✅ **claude-seo/**: diretório de configuração e scripts de SEO (agentes, extensões, documentação)
- ⏳ Performance audit
- ⏳ Acessibilidade audit

> Histórico: a API de **reescrita de currículos** (resume adaptation) foi implementada,
> depois removida (commit `0465180`) e **re-implementada** com PDF export (commits `c709863`,
> `e363b1d`) — hoje é a tool `generate_resume` + `POST /api/resume/generate`.

## Expansão futura
- Notificações em tempo real
- Integração com LinkedIn API
- Pipeline Discovery avançado (mais fontes — o discovery já roda para usuários logados; expandir fontes)
- App mobile (React Native)
- Modo offline completo (PWA)
