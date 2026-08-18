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
- ✅ Suíte Vitest (102 arquivos · 727 testes passando) + e2e Playwright em `e2e/`
- ✅ **Currículo adaptado (PDF)**: tool `generate_resume` no chat + `POST /api/resume/generate` + botão por vaga na `/busca` (download direto), com veracidade garantida em 3 camadas
- ✅ **Rate limiting da análise ATS** (`/api/ats/analyze`) e da geração de currículo (`resume_daily`)
- ✅ **Expansão híbrida de queries**: mapa curado + IA cacheada (Redis global) + dedupe de quase-duplicatas, com fail-open e single-flight
- ✅ **Filtro de relevância**: descarta vagas de design físico (moda/industrial) em buscas de design
- ✅ **Filtro de frescor**: descarta vagas com `postedAt` > 20 dias
- ✅ **Paginação do MCP Gupy**: offset 0→500 (antes 1 chamada de 100 por query — logados recebiam menos que anônimos)
- ✅ **Cache SWR do pipeline** (stale-while-revalidate, 5 min stale / 30 min expire)
- ✅ **Resultados da busca exibidos para logados**: `pipeline_complete` carrega `jobs` para todos os usuários (antes só anônimos; logados recarregavam a lista recomendada por perfil)
- ✅ **Ordenação por recência** dos resultados do pipeline (`sortJobsByRecency`)
- ✅ **Painel admin** (`/admin`, role `admin` no User): métricas de usuários, logins, buscas (termos/empresas), ferramentas de chat, tokens e cursos por dia (Recharts)
- ⏳ Performance audit
- ⏳ Acessibilidade audit

> Histórico: a API de **reescrita de currículos** (resume adaptation) foi implementada,
> depois removida (commit `0465180`) e **re-implementada** com PDF export (commits `c709863`,
> `e363b1d`) — hoje é a tool `generate_resume` + `POST /api/resume/generate`.

## v3 (Futuro)
- Notificações em tempo real
- Integração com LinkedIn API
- Pipeline Discovery avançado (mais fontes — o discovery já roda para usuários logados; expandir fontes)
- App mobile (React Native)
- Modo offline completo (PWA)
